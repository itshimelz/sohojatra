"""
Integration bridge: calls the Modal serverless GPU endpoint for the
fine-tuned LoRA analyzer and maps categorical outputs to floats.

Urgency mapping  : critical → 0.9 | moderate → 0.5 | low → 0.1
Sentiment mapping: derived from dominant emotion label
  frustration / fear / grief / resignation → negative (< 0)
  hope / civic_pride                       → positive (> 0)
  urgency / sarcasm                        → slightly negative

Requires MODAL_API_URL in .env.  Falls back to Claude Haiku if unset or
if the Modal endpoint returns an error.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_URGENCY_TO_FLOAT: dict[str, float] = {
    "critical": 0.9,
    "moderate": 0.5,
    "low": 0.1,
}

_EMOTION_SENTIMENT: dict[str, float] = {
    "frustration": -0.7,
    "fear": -0.6,
    "grief": -0.5,
    "resignation": -0.4,
    "helplessness": -0.6,
    "sarcasm": -0.3,
    "urgency": -0.2,
    "hope": 0.5,
    "civic_pride": 0.6,
}


def is_available() -> bool:
    from src.config import settings
    return bool(settings.modal_api_url)


async def _call_modal(text: str, task: str) -> dict[str, Any]:
    from src.config import settings
    url = settings.modal_api_url.rstrip("/")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json={"text": text, "task": task})
        resp.raise_for_status()
        return resp.json()


async def analyze(text: str) -> dict[str, float | str]:
    """
    Returns {"sentiment": float, "urgency": float, "source": "finetuned"}.
    Raises on failure so the caller can fall back to Claude Haiku.
    """
    urgency_data = await _call_modal(text, task="urgency")
    if "error" in urgency_data:
        raise RuntimeError(f"Modal urgency error: {urgency_data['error']}")

    urgency_label = urgency_data.get("urgency_level", "moderate").lower()
    urgency_float = _URGENCY_TO_FLOAT.get(urgency_label, 0.5)

    try:
        emotion_data = await _call_modal(text, task="emotion")
        emotions: list[str] = emotion_data.get("emotions", [])
    except Exception:
        emotions = []

    scores = [_EMOTION_SENTIMENT[e] for e in emotions if e in _EMOTION_SENTIMENT]
    sentiment_float = round(sum(scores) / len(scores), 4) if scores else 0.0

    return {
        "sentiment": float(max(-1.0, min(1.0, sentiment_float))),
        "urgency": urgency_float,
        "source": "finetuned",
    }
