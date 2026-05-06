# DementiaNext backend image — runs on Hugging Face Spaces (Docker SDK).
#
# This container hosts the Django web API, the django-q2 worker, ChromaDB
# (companion RAG), and PyTorch ResNet inference. It does NOT install FSL or
# HD-BET — those run on Modal (GPU) and are imported by `modal_app.py`.

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive \
    HF_HOME=/app/.cache/huggingface \
    TRANSFORMERS_CACHE=/app/.cache/huggingface

# System libs needed by numpy / Pillow / opencv-python wheels at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first so Docker layer caching survives code edits.
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the source.
COPY . .

# HF Spaces require running as a non-root user (UID 1000) so /app and the
# HuggingFace cache must be owned by that user.
RUN useradd -m -u 1000 user \
    && mkdir -p /app/.cache/huggingface /app/models /app/.chroma_db /app/media \
    && chown -R user:user /app

USER user

# HF Spaces routes external traffic to whatever port the container listens on
# (default 7860, override via README.md `app_port`).
EXPOSE 7860

RUN chmod +x start.sh
CMD ["./start.sh"]
