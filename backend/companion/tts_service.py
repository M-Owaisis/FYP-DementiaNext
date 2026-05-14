import asyncio
import os
import uuid
import logging
import threading
import tempfile
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from typing import Optional, Callable

logger = logging.getLogger(__name__)

_edge_tts = None


def _ensure_edge_tts():
    global _edge_tts
    if _edge_tts is None:
        import edge_tts as _mod
        _edge_tts = _mod
    return _edge_tts


def synthesize(text: str, voice: str = "en-US-AriaNeural") -> str | None:
    """Convert text to speech using edge-tts. Returns the storage URL or None."""
    try:
        edge_tts = _ensure_edge_tts()
        filename = f"{uuid.uuid4().hex}.mp3"
        storage_path = f"companion_audio/{filename}"

        async def _generate(tmp_path):
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(tmp_path)

        # Use a temporary file to hold the TTS output before uploading to storage
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            loop = asyncio.new_event_loop()
            try:
                loop.run_until_complete(_generate(tmp_path))
            finally:
                loop.close()

            # Upload to default storage (e.g. Backblaze)
            with open(tmp_path, "rb") as f:
                saved_path = default_storage.save(storage_path, ContentFile(f.read()))
            
            # Return the public/signed URL
            return default_storage.url(saved_path)
            
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except Exception:
        logger.exception("TTS synthesis failed")
        return None


# Global registry for async TTS generation status
_tts_tasks: dict[str, dict] = {}
_tts_lock = threading.Lock()


def generate_tts_async(
    text: str, 
    voice: str = "en-US-AriaNeural",
    task_id: Optional[str] = None,
    on_complete: Optional[Callable[[str, Optional[str]], None]] = None
) -> str:
    """
    Start TTS generation in a background thread. Returns task_id immediately.
    
    Args:
        text: Text to synthesize
        voice: Voice to use
        task_id: Optional task ID (auto-generated if not provided)
        on_complete: Optional callback(task_id, audio_url) when done
    
    Returns:
        task_id that can be used to poll for completion
    """
    if task_id is None:
        task_id = uuid.uuid4().hex
    
    with _tts_lock:
        _tts_tasks[task_id] = {
            "status": "pending",
            "audio_url": None,
            "error": None,
        }
    
    def _worker():
        try:
            result = synthesize(text, voice)
            with _tts_lock:
                _tts_tasks[task_id]["status"] = "completed"
                _tts_tasks[task_id]["audio_url"] = result
            
            if on_complete:
                on_complete(task_id, result)
        except Exception as e:
            with _tts_lock:
                _tts_tasks[task_id]["status"] = "failed"
                _tts_tasks[task_id]["error"] = str(e)
            logger.exception("Async TTS generation failed for task %s", task_id)
    
    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    
    return task_id


def get_tts_status(task_id: str) -> Optional[dict]:
    """
    Get the status of an async TTS generation task.
    
    Returns:
        {"status": "pending"|"completed"|"failed", "audio_url": str|None, "error": str|None}
        or None if task_id not found
    """
    with _tts_lock:
        return _tts_tasks.get(task_id, {}).copy() if task_id in _tts_tasks else None


def cleanup_tts_task(task_id: str):
    """Remove a TTS task from the registry after it's been consumed."""
    with _tts_lock:
        _tts_tasks.pop(task_id, None)
