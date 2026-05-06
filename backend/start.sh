#!/bin/bash
# Boot script for the DementiaNext backend container.
#   1. Apply database migrations (Django + django-q2 tables on Neon).
#   2. Download .pth weights from HF Hub if not already on disk.
#   3. Run gunicorn (web) and the django-q2 worker side-by-side.
set -e

echo "[start] migrate..."
python manage.py migrate --noinput

echo "[start] fetch model weights..."
python boot.py

echo "[start] launching gunicorn + qcluster..."

gunicorn core.wsgi:application \
    --bind 0.0.0.0:7860 \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - &
WEB_PID=$!

python manage.py qcluster &
WORKER_PID=$!

# Forward SIGTERM/SIGINT to children so the container stops cleanly.
trap "echo '[start] shutting down...'; kill -TERM $WEB_PID $WORKER_PID 2>/dev/null; wait" SIGTERM SIGINT

# Exit when either process dies — HF Spaces will then restart the container.
wait -n
exit $?
