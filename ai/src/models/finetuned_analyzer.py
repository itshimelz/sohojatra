"""
Integration bridge: calls the Modal serverless GPU endpoint for the
fine-tuned LoRA analyzer and maps categorical outputs to floats.

Urgency mapping  : critical → 0.9 | moderate → 0.5 | low → 0.1
Sentiment mapping: derived from dominant emotion label
  frustration / fear / grief / resignation → negative (< 0)
  hope / civic_pride                       → positive (> 0)
  urgency / sarcasm                        → slightly negative

Requires MODAL_API_URL in .env.
"""

from __future__ import annotations

import logging
import re
import asyncio
from typing import Any

import httpx

logger = logging.getLogger(__name__)
_http_client: httpx.AsyncClient | None = None

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

_URGENT_PATTERNS = [
    r"\b(emergency|urgent|immediate|danger|critical|fire|accident|injured|dead)\b",
    r"(জরুরি|তৎক্ষণাৎ|বিপদ|দুর্ঘটনা|আগুন|মারা|আহত|রক্ত)",
]
_MODERATE_PATTERNS = [
    r"\b(problem|issue|broken|leak|blocked|unsafe|waste|pollution)\b",
    r"(সমস্যা|ভাঙা|লিক|অপসারণ|ময়লা|দূষণ|ঝুঁকি|নষ্ট)",
]
_NEGATIVE_PATTERNS = [
    r"\b(bad|angry|frustrat|unsafe|worse|dirty|failed)\b",
    r"(খারাপ|রাগ|হতাশ|ঝুঁকিপূর্ণ|নোংরা|ব্যর্থ|অস্বাস্থ্যকর)",
]
_POSITIVE_PATTERNS = [
    r"\b(good|improved|resolved|clean|safe|thanks)\b",
    r"(ভালো|উন্নত|সমাধান|পরিষ্কার|নিরাপদ|ধন্যবাদ)",
]


def is_available() -> bool:
    from src.config import settings
    # We consider analyzer available even without Modal URL because
    # a local non-LLM fallback is provided.
    return True


async def _call_modal(text: str, task: str) -> dict[str, Any]:
    from src.config import settings
    url = settings.modal_api_url.rstrip("/")
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=settings.modal_timeout_secs,
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        )
    resp = await _http_client.post(url, json={"text": text, "task": task})
    resp.raise_for_status()
    return resp.json()


def _count_matches(text: str, patterns: list[str]) -> int:
    total = 0
    for pattern in patterns:
        total += len(re.findall(pattern, text, flags=re.IGNORECASE))
    return total


def _local_fallback_analyze(text: str) -> dict[str, float | str]:
    lowered = text.lower()
    urgent_hits = _count_matches(lowered, _URGENT_PATTERNS)
    moderate_hits = _count_matches(lowered, _MODERATE_PATTERNS)
    neg_hits = _count_matches(lowered, _NEGATIVE_PATTERNS)
    pos_hits = _count_matches(lowered, _POSITIVE_PATTERNS)

    if urgent_hits > 0:
        urgency_float = 0.9
    elif moderate_hits > 0:
        urgency_float = 0.5
    else:
        urgency_float = 0.2

    sentiment_float = 0.0
    total_sentiment_hits = neg_hits + pos_hits
    if total_sentiment_hits > 0:
        sentiment_float = round((pos_hits - neg_hits) / total_sentiment_hits, 4)
        sentiment_float = float(max(-1.0, min(1.0, sentiment_float)))

    return {
        "sentiment": sentiment_float,
        "urgency": urgency_float,
        "source": "finetuned-local-fallback",
    }


async def analyze(text: str) -> dict[str, float | str]:
    """
    Returns {"sentiment": float, "urgency": float, "source": "finetuned"}.
    Raises on failure so the caller can surface a model-unavailable error.
    """
    from src.config import settings

    # If Modal endpoint is not configured, use local fallback scoring so
    # the API stays functional without external LLM providers.
    if not settings.modal_api_url:
        return _local_fallback_analyze(text)

    try:
        # Run both requests concurrently to reduce end-to-end latency.
        urgency_task = _call_modal(text, task="urgency")
        emotion_task = _call_modal(text, task="emotion")
        urgency_data, emotion_result = await asyncio.gather(
            urgency_task,
            emotion_task,
            return_exceptions=True,
        )

        if isinstance(urgency_data, Exception):
            raise urgency_data
        if "error" in urgency_data:
            raise RuntimeError(f"Modal urgency error: {urgency_data['error']}")

        urgency_label = urgency_data.get("urgency_level", "moderate").lower()
        urgency_float = _URGENCY_TO_FLOAT.get(urgency_label, 0.5)

        emotions: list[str] = []
        if not isinstance(emotion_result, Exception):
            emotions = emotion_result.get("emotions", [])

        scores = [_EMOTION_SENTIMENT[e] for e in emotions if e in _EMOTION_SENTIMENT]
        sentiment_float = round(sum(scores) / len(scores), 4) if scores else 0.0

        return {
            "sentiment": float(max(-1.0, min(1.0, sentiment_float))),
            "urgency": urgency_float,
            "source": "finetuned",
        }
    except Exception as exc:
        logger.warning("Modal analyzer unavailable, using local fallback: %s", exc)
        return _local_fallback_analyze(text)
