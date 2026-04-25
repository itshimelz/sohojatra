"""
POST /analyze
Bangla NLP: BanglaBERT language detection + fine-tuned model sentiment & urgency.
"""

from __future__ import annotations

import json
import logging
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from src.config import settings
from src.models import finetuned_analyzer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["nlp"])

# ── Lazy singletons ────────────────────────────────────────────────────────────

_banglabert_pipe = None
_BANGLA_CHAR_RE = re.compile(r"[\u0980-\u09FF]")


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


# ── Schemas ────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    text: str = Field(default="", max_length=4096)
    user_id: str = Field(default="anonymous", min_length=1)

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data):
        if not isinstance(data, dict):
            return data

        # Backward-compatible aliases for existing clients.
        text = data.get("text")
        if text is None:
            text = data.get("body") or data.get("content") or data.get("prompt") or ""

        user_id = data.get("user_id")
        if user_id is None:
            user_id = data.get("userId") or data.get("uid") or "anonymous"

        return {
            **data,
            "text": str(text).strip(),
            "user_id": str(user_id).strip() or "anonymous",
        }


class AnalyzeResponse(BaseModel):
    sentiment: float = Field(..., ge=-1.0, le=1.0, description="Negative→Positive")
    urgency: float = Field(..., ge=0.0, le=1.0)
    language: str


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    if not req.text:
        raise HTTPException(status_code=400, detail="text is required")

    # 1. Language detection
    # Prefer script detection first: any Bangla Unicode char => bn.
    if _BANGLA_CHAR_RE.search(req.text):
        language = "bn"
    else:
        try:
            pipe = _get_banglabert()
            result = pipe(req.text[:512])
            label: str = result[0][0]["label"]
            language = "bn" if "bn" in label.lower() or "bangla" in label.lower() else "en"
        except Exception:
            language = "unknown"

    # 2. Sentiment + urgency — fine-tuned model only
    if not finetuned_analyzer.is_available():
        raise HTTPException(status_code=503, detail="Fine-tuned model is not available")

    try:
        ft_result = await finetuned_analyzer.analyze(req.text)
        return AnalyzeResponse(
            sentiment=ft_result["sentiment"],
            urgency=ft_result["urgency"],
            language=language,
        )
    except (json.JSONDecodeError, KeyError, IndexError) as exc:
        logger.warning("Fine-tuned model response parse error: %s", exc)
        raise HTTPException(status_code=502, detail="Fine-tuned model response malformed")
    except Exception as exc:
        logger.error("Fine-tuned model inference error: %s", exc)
        raise HTTPException(status_code=503, detail="Fine-tuned model unavailable")
