"""POST /match_research — RAG over research corpus via LlamaIndex + pgvector."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.mlops.tracker import log_call
from src.rag.research_pipeline import research_match

router = APIRouter(prefix="/match_research", tags=["rag"])


class MatchRequest(BaseModel):
    concern_text: str = Field(..., min_length=5, max_length=2048)
    top_k: int = Field(default=3, ge=1, le=10)


class ResearchHit(BaseModel):
    title: str
    snippet: str
    relevance_score: float


class MatchResponse(BaseModel):
    results: list[ResearchHit]


@router.post("", response_model=MatchResponse)
@log_call(model_name="research_rag")
async def match_research(req: MatchRequest) -> MatchResponse:
    hits = await research_match(req.concern_text, top_k=req.top_k)
    return MatchResponse(results=[ResearchHit(**h) for h in hits])
