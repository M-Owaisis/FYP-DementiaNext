---
title: DementiaNext Backend
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# DementiaNext — Backend (Hugging Face Space)

Django REST API + django-q2 worker + ChromaDB companion. Heavy preprocessing
(HD-BET + FSL) is offloaded to a Modal GPU function defined in `modal_app.py`;
this container only runs the web server, the task worker, and lightweight
PyTorch ResNet inference.

## Required Space secrets

| Secret | Source | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | any random 50-char string | Django session signing |
| `DJANGO_DEBUG` | `false` | Disables Django debug mode in production |
| `DATABASE_URL` | Neon → Connect | Postgres connection string |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 → API token | S3-compatible auth |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → API token | S3-compatible auth |
| `R2_ENDPOINT_URL` | Cloudflare R2 → API token | e.g. `https://<account>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | Cloudflare R2 → bucket name | e.g. `dementianext-mri` |
| `HF_TOKEN` | huggingface.co → Settings → Access Tokens | Pulls model weights |
| `HF_MODEL_REPO` | huggingface.co → your model repo | e.g. `your-username/dementianext-models` |
| `MODAL_TOKEN_ID` | `modal token new` | Calling Modal preprocessing function |
| `MODAL_TOKEN_SECRET` | `modal token new` | Calling Modal preprocessing function |
| `GROQ_API_KEY` | console.groq.com | Companion chatbot LLM |

`CORS_ALLOWED_ORIGINS` should list your Vercel frontend URL (set as a normal
env var, comma-separated if multiple).

## Health check

`GET /api/health` returns `{"status": "ok"}` once Django is up. Point an
UptimeRobot monitor at it every 5 min to prevent the 48 h idle pause.

## Local development

This Space is built for production hosting. For local dev, follow the root
`README.md` instead — it uses SQLite + the local filesystem and skips the
Modal/R2 indirection.
