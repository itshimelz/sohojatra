"""POST /rank_comment — weighted comment scoring with Redis cache."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator

from src.models.comment_ranker import rank_comment

router = APIRouter(prefix="/rank_comment", tags=["ranking"])


class RankRequest(BaseModel):
    comment_id: str = "unknown"
    sentiment: float = Field(default=0.0, ge=-1.0, le=1.0)
    urgency: float = Field(default=0.0, ge=0.0, le=1.0)
    engagement_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    fake_prob: float = Field(default=0.0, ge=0.0, le=1.0)

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data):
        if not isinstance(data, dict):
            return data
        return {
            **data,
            "comment_id": str(data.get("comment_id") or data.get("commentId") or "unknown"),
            "engagement_rate": data.get("engagement_rate", data.get("engagement", 0.0)),
            "fake_prob": data.get("fake_prob", data.get("fakeProbability", 0.0)),
        }


class RankResponse(BaseModel):
    score: float
    rank_label: str  # "high" | "medium" | "low"


@router.post("", response_model=RankResponse)
async def rank_comment_endpoint(req: RankRequest) -> RankResponse:
    result = await rank_comment(
        comment_id=req.comment_id,
        sentiment=req.sentiment,
        urgency=req.urgency,
        engagement_rate=req.engagement_rate,
        fake_prob=req.fake_prob,
    )
    return RankResponse(**result)
