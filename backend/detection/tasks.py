"""
Async preprocessing + inference task.

Runs in the django-q2 worker (separate process from the gunicorn web server).
For each DetectionResult it:

    1. Generates presigned R2 URLs for the input file and a target output key.
    2. Calls the Modal GPU function `dementianext-preprocess::preprocess_mri`,
       which downloads the input from R2, runs HD-BET + FSL + spatial norm /
       resize, and uploads the preprocessed NIfTI back to R2.
    3. Downloads the preprocessed NIfTI to /tmp, extracts the middle axial
       slice as a PIL image, and runs the binary or subtype ResNet on it.
    4. Persists the result back to the DetectionResult row.

Plain image uploads (PNG/JPG) skip Modal entirely — they're sent straight
through inference.

The function is registered with django-q2 by name; the view side calls
`async_task("detection.tasks.run_detection_task", detection_id, model_type)`.
"""

from __future__ import annotations

import logging
import math
import os
import tempfile
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Extensions that go through the Modal preprocessing pipeline.
_MRI_EXTS = (".nii", ".nii.gz", ".dcm", ".zip")


def _is_mri_filename(name: str) -> bool:
    n = name.lower()
    return any(n.endswith(ext) for ext in _MRI_EXTS)


def _r2_client():
    """Build a boto3 S3 client pointed at Cloudflare R2."""
    import boto3
    from botocore.client import Config

    return boto3.client(
        "s3",
        endpoint_url=os.environ["R2_ENDPOINT_URL"],
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def _download_to_tmp(url: str, suffix: str) -> str:
    """Stream a URL to a temp file and return its absolute path."""
    import requests

    fd, path = tempfile.mkstemp(suffix=suffix, prefix="det_")
    os.close(fd)
    with requests.get(url, stream=True, timeout=300) as resp:
        resp.raise_for_status()
        with open(path, "wb") as fh:
            for chunk in resp.iter_content(chunk_size=8 * 1024 * 1024):
                if chunk:
                    fh.write(chunk)
    return path


def _nifti_middle_slice_pil(nifti_path: str):
    """Load a NIfTI volume and return its middle axial slice as a PIL RGB Image."""
    import nibabel as nib
    import numpy as np
    from PIL import Image

    nii = nib.load(nifti_path)
    data = nii.get_fdata()
    mid = data.shape[2] // 2
    slice_data = data[:, :, mid]
    s_min, s_max = slice_data.min(), slice_data.max()
    if s_max > s_min:
        normalized = ((slice_data - s_min) / (s_max - s_min) * 255).astype(np.uint8)
    else:
        normalized = np.zeros_like(slice_data, dtype=np.uint8)
    return Image.fromarray(normalized).convert("RGB")


def _run_binary(image_tensor, needs_pipeline: bool) -> dict:
    """Run the binary dementia detector on a (1, 3, 224, 224) tensor."""
    import torch
    from .views import ModelLoader  # lazy — avoids circular import at module load

    loader = ModelLoader()
    model = loader.model
    device = loader.device
    image_tensor = image_tensor.to(device)

    with torch.no_grad():
        output = model(image_tensor)
        probability = torch.sigmoid(output).item()

    if math.isnan(probability):
        raise ValueError("Binary model returned NaN.")

    threshold = 0.5
    predicted_class = "dementia" if probability >= threshold else "cn"
    return {
        "predicted_class": predicted_class,
        "confidence": max(probability, 1 - probability),
        "probabilities": {
            "dementia": float(probability),
            "cn": float(1 - probability),
        },
        "analysis": {
            "sigmoid_probability": float(probability),
            "threshold_used": threshold,
            "model_version": "Binary-ResNet-34-v1.0",
            "model_type": "binary",
            "pipeline_preprocessing": needs_pipeline,
        },
    }


def _run_subtype(image_tensor, needs_pipeline: bool) -> dict:
    """Run the 4-class subtype classifier on a (1, 3, 224, 224) tensor."""
    import torch
    from .views import SubtypeModelLoader

    loader = SubtypeModelLoader()
    model = loader.model
    device = loader.device
    image_tensor = image_tensor.to(device)

    with torch.no_grad():
        output = model(image_tensor)
        probabilities = torch.softmax(output, dim=1).squeeze()

    if torch.isnan(probabilities).any():
        raise ValueError("Subtype model returned NaN.")

    predicted_idx = int(torch.argmax(probabilities).item())
    class_names = SubtypeModelLoader.CLASS_NAMES  # ['ad', 'pd', 'ftd', 'cn']
    class_to_db = {"ad": "alzheimers", "pd": "pd", "ftd": "ftd", "cn": "cn"}
    return {
        "predicted_class": class_to_db[class_names[predicted_idx]],
        "confidence": float(probabilities[predicted_idx].item()),
        "probabilities": {
            "alzheimers": float(probabilities[0].item()),
            "pd": float(probabilities[1].item()),
            "ftd": float(probabilities[2].item()),
            "cn": float(probabilities[3].item()),
        },
        "analysis": {
            "softmax_probabilities": [float(x) for x in probabilities.tolist()],
            "predicted_index": predicted_idx,
            "model_version": "Subtype-ResNet-34-v1.0",
            "model_type": "subtype",
            "pipeline_preprocessing": needs_pipeline,
        },
    }


def _call_modal(input_url: str, upload_url: str, input_filename: str) -> dict[str, Any]:
    """Invoke the deployed Modal preprocessing function and return its result dict."""
    import modal

    fn = modal.Function.from_name("dementianext-preprocess", "preprocess_mri")
    return fn.remote(
        input_url=input_url,
        upload_url=upload_url,
        input_filename=input_filename,
    )


def run_detection_task(detection_id: int, model_type: str = "binary") -> str:
    """
    Async entry point. Returns a short status string for the django-q2 dashboard.
    """
    from torchvision import transforms

    from .models import DetectionResult
    from .views import _ensure_ml_libs

    detection = DetectionResult.objects.get(id=detection_id)
    detection.status = "processing"
    detection.error_message = None
    detection.save(update_fields=["status", "error_message"])

    started = time.time()
    tmp_files: list[str] = []

    try:
        _ensure_ml_libs()

        # The R2 object key is what django-storages stored.
        input_key = detection.uploaded_file.name
        input_filename = os.path.basename(input_key)
        needs_pipeline = _is_mri_filename(input_filename)

        if needs_pipeline:
            bucket = os.environ["R2_BUCKET"]
            output_key = f"preprocessed/{detection.detection_id}.nii.gz"

            s3 = _r2_client()
            input_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": input_key},
                ExpiresIn=900,
            )
            upload_url = s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": bucket,
                    "Key": output_key,
                    "ContentType": "application/octet-stream",
                },
                ExpiresIn=900,
            )

            logger.info("Calling Modal preprocess for %s", detection.detection_id)
            modal_result = _call_modal(input_url, upload_url, input_filename)
            if not modal_result.get("success"):
                raise RuntimeError(
                    "Modal preprocessing failed: "
                    + modal_result.get("error", "<no error message>")
                )

            detection.preprocessed_file = output_key
            detection.save(update_fields=["preprocessed_file"])

            preprocessed_get_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": output_key},
                ExpiresIn=600,
            )
            local_nifti = _download_to_tmp(preprocessed_get_url, suffix=".nii.gz")
            tmp_files.append(local_nifti)

            image = _nifti_middle_slice_pil(local_nifti)
        else:
            # Plain 2D image (e.g. PNG/JPG). Pull straight from R2.
            from PIL import Image

            s3 = _r2_client()
            ext = Path(input_filename).suffix or ".png"
            input_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": os.environ["R2_BUCKET"], "Key": input_key},
                ExpiresIn=600,
            )
            local_image = _download_to_tmp(input_url, suffix=ext)
            tmp_files.append(local_image)
            image = Image.open(local_image).convert("RGB")

        transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
                ),
            ]
        )
        image_tensor = transform(image).unsqueeze(0)

        if model_type == "subtype":
            result = _run_subtype(image_tensor, needs_pipeline)
        else:
            result = _run_binary(image_tensor, needs_pipeline)

        detection.status = "completed"
        detection.predicted_class = result["predicted_class"]
        detection.confidence_score = result["confidence"]
        detection.prediction_probability = result["probabilities"]
        detection.analysis_details = result["analysis"]
        detection.processing_time = time.time() - started
        detection.save()

        return f"completed:{detection.detection_id}"

    except Exception as exc:
        logger.exception("Detection %s failed", detection_id)
        detection.status = "failed"
        detection.error_message = f"{type(exc).__name__}: {exc}"[:1000]
        detection.processing_time = time.time() - started
        detection.save(update_fields=["status", "error_message", "processing_time"])
        return f"failed:{detection.detection_id}"

    finally:
        for path in tmp_files:
            try:
                os.unlink(path)
            except OSError:
                pass
