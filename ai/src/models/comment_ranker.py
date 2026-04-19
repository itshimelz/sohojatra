"""
Comment scoring and ranking.

score = (0.4 × |sentiment|) + (0.3 × urgency) + (0.2 × engagement_rate) − (0.1 × fake_prob)
Cached in Redis under key "score:{comment_id}" with TTL=3600s.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import redis.asyncio as aioredis

from src.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


def _get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


def compute_score(
    sentiment: float,
    urgency: float,
    engagement_rate: float,
    fake_prob: float,
) -> float:
    """Pure scoring formula — no I/O."""
    raw = (
        0.4 * abs(sentiment)
        + 0.3 * urgency
        + 0.2 * engagement_rate
        - 0.1 * fake_prob
    )
    return round(max(0.0, min(1.0, raw)), 4)


def score_to_label(score: float) -> str:
    if score >= 0.65:
        return "high"
    if score >= 0.35:
        return "medium"
    return "low"


async def rank_comment(
    comment_id: str,
    sentiment: float,
    urgency: float,
    engagement_rate: float,
    fake_prob: float,
) -> dict[str, Any]:
    """Compute score, write to Redis cache, return result dict."""
    cache_key = f"score:{comment_id}"
    r = _get_redis()

    cached = await r.get(cache_key)
    if cached:
        return json.loads(cached)

    score = compute_score(sentiment, urgency, engagement_rate, fake_prob)
    label = score_to_label(score)
    result = {"score": score, "rank_label": label}

    await r.setex(cache_key, settings.score_cache_ttl, json.dumps(result))
    return result
