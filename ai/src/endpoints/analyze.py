"""
POST /analyze
Bangla NLP: BanglaBERT language detection + Claude Haiku sentiment & urgency.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Annotated

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.config import settings
from src.mlops.tracker import log_call

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["nlp"])

# ── Lazy singletons ────────────────────────────────────────────────────────────

_banglabert_pipe = None
_anthropic_client = None


def _get_banglabert():
    global _banglabert_pipe
    if _banglabert_pipe is None:
        from transformers import pipeline
        _banglabert_pipe = pipeline(
            "text-classification",
            model=settings.banglabert_model,
            top_k=1,
        )
    return _banglabert_pipe


def _get_anthropic() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


# ── Schemas ────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)
    user_id: str = Field(..., min_length=1)


class AnalyzeResponse(BaseModel):
    sentiment: float = Field(..., ge=-1.0, le=1.0, description="Negative→Positive")
    urgency: float = Field(..., ge=0.0, le=1.0)
    language: str


# ── LLM prompt ────────────────────────────────────────────────────────────────

_SYSTEM = """\
You are a civic sentiment analysis AI for the Sohojatra platform (Bangladesh).
Analyze the given text and return ONLY a JSON object — no prose, no markdown.

Schema:
{
  "sentiment": <float -1.0 to 1.0>,   // negative=harmful/angry, positive=constructive
  "urgency":   <float 0.0 to 1.0>     // 0=routine, 1=emergency requiring immediate action
}"""


async def _claude_scores(text: str) -> tuple[float, float]:
    client = _get_anthropic()
    msg = await client.messages.create(
        model=settings.claude_model,
        max_tokens=64,
        system=_SYSTEM,
        messages=[{"role": "user", "content": text}],
    )
    raw = msg.content[0].text.strip()
    data = json.loads(raw)
    sentiment = float(max(-1.0, min(1.0, data["sentiment"])))
    urgency = float(max(0.0, min(1.0, data["urgency"])))
    return sentiment, urgency


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("", response_model=AnalyzeResponse)
@log_call(model_name="analyze")
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    # 1. Language detection via BanglaBERT
    try:
        pipe = _get_banglabert()
        result = pipe(req.text[:512])
        label: str = result[0][0]["label"]
        language = "bn" if "bn" in label.lower() or "bangla" in label.lower() else "en"
    except Exception:
        language = "unknown"

    # 2. Sentiment + urgency via Claude Haiku
    try:
        sentiment, urgency = await _claude_scores(req.text)
    except (json.JSONDecodeError, KeyError, IndexError) as exc:
        logger.warning("Claude response parse error: %s", exc)
        raise HTTPException(status_code=502, detail="LLM response malformed")
    except anthropic.APIError as exc:
        logger.error("Anthropic API error: %s", exc)
        raise HTTPException(status_code=503, detail="LLM service unavailable")

    return AnalyzeResponse(sentiment=sentiment, urgency=urgency, language=language)
