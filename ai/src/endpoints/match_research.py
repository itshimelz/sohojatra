"""POST /match_research — RAG over research corpus via LlamaIndex + pgvector."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator

from src.rag.research_pipeline import research_match

router = APIRouter(prefix="/match_research", tags=["rag"])


class MatchRequest(BaseModel):
    concern_text: str = Field(default="", max_length=2048)
    top_k: int = Field(default=3, ge=1, le=10)

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data):
        if not isinstance(data, dict):
            return data
        concern_text = (
            data.get("concern_text")
            or data.get("text")
            or data.get("question")
            or data.get("query")
            or ""
        )
        return {**data, "concern_text": str(concern_text).strip()}


class ResearchHit(BaseModel):
    title: str
    snippet: str
    relevance_score: float


class MatchResponse(BaseModel):
    results: list[ResearchHit]


@router.post("", response_model=MatchResponse)
async def match_research(req: MatchRequest) -> MatchResponse:
    if not req.concern_text:
        return MatchResponse(results=[])
    hits = await research_match(req.concern_text, top_k=req.top_k)
    return MatchResponse(results=[ResearchHit(**h) for h in hits])
