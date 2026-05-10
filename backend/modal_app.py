"""
Modal app: GPU preprocessing pipeline for DementiaNext.

This module defines a Modal serverless function that runs the full MRI
preprocessing pipeline (Phase 1: DICOM->NIfTI; Phase 2: HD-BET skull
stripping + FSL bias correction + MNI alignment + intensity norm + resize)
on an NVIDIA T4 GPU.

The Django backend on Hugging Face Space invokes this function over RPC.
HD-BET is the only step that benefits meaningfully from a GPU, but the
whole pipeline lives here so the HF Space stays small (no FSL install).

Deploy from the `backend/` directory:
    modal deploy modal_app.py

Smoke-test:
    modal run modal_app.py::smoke_test \\
        --input-url <presigned-GET> \\
        --upload-url <presigned-PUT> \\
        --input-filename scan.nii.gz
"""

from __future__ import annotations

from pathlib import Path

import modal

APP_NAME = "dementianext-preprocess"
app = modal.App(APP_NAME)

PIPELINE_DIR = Path(__file__).resolve().parent / "pipeline"

# Container image: Debian slim + FSL + HD-BET + the pipeline source.
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "wget",
        "ca-certificates",
        "build-essential",
        "git",
        "libglib2.0-0",
        "libsm6",
        "libxext6",
        "libxrender1",
        "libgl1",
    )
    # Headless FSL install (~5 GB). Only rebuilt when this layer changes.
    .run_commands(
        "wget -q https://fsl.fmrib.ox.ac.uk/fsldownloads/fslconda/releases/fslinstaller.py",
        "python fslinstaller.py -d /opt/fsl -V 6.0.7.4 -q || python fslinstaller.py -d /opt/fsl",
        "rm -f fslinstaller.py",
    )
    .env(
        {
            "FSLDIR": "/opt/fsl",
            "FSLOUTPUTTYPE": "NIFTI_GZ",
            "PATH": "/opt/fsl/bin:/opt/fsl/share/fsl/bin:/usr/local/bin:/usr/bin:/bin",
        }
    )
    .pip_install(
        # CRITICAL: numpy<2. Many ML libs (nibabel, pydicom, scipy wheels)
        # are compiled against numpy 1.x and segfault under 2.x with the
        # classic "numpy.core.multiarray failed to import" error.
        "numpy<2",
        "torch",
        "torchvision",
        "scipy",
        "scikit-learn",
        "nibabel",
        "Pillow",
        "pydicom",
        "pandas",
        "tqdm",
        "matplotlib",
        "opencv-python",
        "hd-bet",
        "requests",
    )
    # Embed the pipeline code into the image. Editing pipeline/*.py and
    # re-running `modal deploy` rebuilds only this layer.
    .add_local_dir(str(PIPELINE_DIR), remote_path="/app/pipeline")
)

# Persistent volume so HD-BET's ~1.5 GB brain extraction weights are
# downloaded once and reused across container starts.
hdbet_cache = modal.Volume.from_name("hdbet-cache", create_if_missing=True)


@app.function(
    image=image,
    gpu="T4",
    timeout=900,             # 15 min hard cap per call
    scaledown_window=300,    # keep container warm for 5 min after last call
    volumes={"/root/.hd_bet": hdbet_cache},
)
def preprocess_mri(
    input_url: str,
    upload_url: str,
    input_filename: str,
) -> dict:
    """
    Download an MRI from R2, run the full preprocessing pipeline on GPU,
    upload the result back to R2.

    Args:
        input_url:       presigned R2 GET URL for the raw upload
        upload_url:      presigned R2 PUT URL for the preprocessed NIfTI
        input_filename:  original filename — used to pick the correct phase
                         (.nii / .nii.gz → Phase 2 only;
                          .dcm / .zip   → Phase 1 then Phase 2)

    Returns:
        {
            "success":          bool,
            "processing_time":  float seconds,
            "output_bytes":     int (only on success),
            "error":            str   (only on failure),
            "traceback":        str   (only on failure),
        }
    """
    import sys
    import time
    import tempfile
    import traceback
    from pathlib import Path as _Path

    import requests

    # The pipeline package was added to the image at /app/pipeline.
    sys.path.insert(0, "/app")
    from pipeline.preprocess import preprocess_mri as run_pipeline

    started = time.time()
    workdir = _Path(tempfile.mkdtemp(prefix="modal_mri_"))

    try:
        # 1. Download the input file
        input_path = workdir / input_filename
        with requests.get(input_url, stream=True, timeout=180) as resp:
            resp.raise_for_status()
            with open(input_path, "wb") as fh:
                for chunk in resp.iter_content(chunk_size=8 * 1024 * 1024):
                    if chunk:
                        fh.write(chunk)

        # 2. Run preprocessing (Phase 1 if needed, then Phase 2)
        out_dir = workdir / "out"
        preprocessed_path = run_pipeline(str(input_path), output_dir=str(out_dir))

        # 3. Upload the preprocessed NIfTI back to R2
        with open(preprocessed_path, "rb") as fh:
            put = requests.put(
                upload_url,
                data=fh,
                headers={"Content-Type": "application/octet-stream"},
                timeout=300,
            )
            put.raise_for_status()

        return {
            "success": True,
            "processing_time": time.time() - started,
            "output_bytes": _Path(preprocessed_path).stat().st_size,
        }

    except Exception as exc:
        return {
            "success": False,
            "processing_time": time.time() - started,
            "error": f"{type(exc).__name__}: {exc}",
            "traceback": traceback.format_exc(),
        }


@app.local_entrypoint()
def smoke_test(
    input_url: str,
    upload_url: str,
    input_filename: str = "scan.nii.gz",
) -> None:
    """One-shot manual test: `modal run modal_app.py::smoke_test --input-url ...`"""
    result = preprocess_mri.remote(input_url, upload_url, input_filename)
    print(result)
