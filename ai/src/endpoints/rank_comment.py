"""POST /rank_comment — weighted comment scoring with Redis cache."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.mlops.tracker import log_call
from src.models.comment_ranker import rank_comment

router = APIRouter(prefix="/rank_comment", tags=["ranking"])


class RankRequest(BaseModel):
    comment_id: str
    sentiment: float = Field(..., ge=-1.0, le=1.0)
    urgency: float = Field(..., ge=0.0, le=1.0)
    engagement_rate: float = Field(..., ge=0.0, le=1.0)
    fake_prob: float = Field(..., ge=0.0, le=1.0)


class RankResponse(BaseModel):
    score: float
    rank_label: str  # "high" | "medium" | "low"


@router.post("", response_model=RankResponse)
@log_call(model_name="comment_ranker")
async def rank_comment_endpoint(req: RankRequest) -> RankResponse:
    result = await rank_comment(
        comment_id=req.comment_id,
        sentiment=req.sentiment,
        urgency=req.urgency,
        engagement_rate=req.engagement_rate,
        fake_prob=req.fake_prob,
    )
    return RankResponse(**result)
