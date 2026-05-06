"""
First-boot helper for the HF Space container.

Downloads the trained PyTorch model weights (`dementia_detector.pth`,
`subtype_classifier.pth`) from a Hugging Face Hub model repository if they
aren't already present in `backend/models/`.

Driven by env vars set as HF Space secrets:
    HF_MODEL_REPO   "<username>/<repo-name>" — the model repo holding the .pth files
    HF_TOKEN        access token with read scope (only required if the repo is private)

The weights are kept out of git so the repo + Docker image stay small.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

WEIGHTS = (
    "dementia_detector.pth",
    "subtype_classifier.pth",
)


def main() -> int:
    repo = os.environ.get("HF_MODEL_REPO", "").strip()
    token = os.environ.get("HF_TOKEN", "").strip() or None

    if not repo:
        print("[boot] HF_MODEL_REPO not set — skipping weight download.")
        print("[boot] Detection endpoints will fail until weights are placed in backend/models/.")
        return 0

    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("[boot] huggingface_hub not installed — skipping.", file=sys.stderr)
        return 0

    for fname in WEIGHTS:
        target = MODELS_DIR / fname
        if target.exists() and target.stat().st_size > 0:
            size_mb = target.stat().st_size / (1024 * 1024)
            print(f"[boot] {fname} already on disk ({size_mb:.0f} MB) — skip.")
            continue

        print(f"[boot] downloading {fname} from {repo}...")
        try:
            downloaded_path = hf_hub_download(
                repo_id=repo,
                filename=fname,
                repo_type="model",
                token=token,
                local_dir=str(MODELS_DIR),
            )
            size_mb = Path(downloaded_path).stat().st_size / (1024 * 1024)
            print(f"[boot]   ok → {downloaded_path} ({size_mb:.0f} MB)")
        except Exception as exc:
            print(f"[boot] FAILED to download {fname}: {exc}", file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
