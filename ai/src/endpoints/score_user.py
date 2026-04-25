"""POST /score_user — fake account detection endpoint."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator

from src.models.fake_account_classifier import predict

router = APIRouter(prefix="/score_user", tags=["moderation"])


class UserFeatures(BaseModel):
    user_id: str = "unknown-user"
    account_age_days: int = Field(default=0, ge=0)
    posts_per_day: float = Field(default=0.0, ge=0.0)
    profile_completeness: float = Field(default=0.0, ge=0.0, le=1.0)
    unique_ip_count: int = Field(default=0, ge=0)
    avg_comment_similarity: float = Field(default=0.0, ge=0.0, le=1.0)
    verified: bool = False

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data):
        if not isinstance(data, dict):
            return data
        return {
            **data,
            "user_id": str(data.get("user_id") or data.get("userId") or "unknown-user"),
            "account_age_days": data.get("account_age_days", data.get("accountAgeDays", 0)),
            "posts_per_day": data.get("posts_per_day", data.get("postsPerDay", 0.0)),
            "profile_completeness": data.get("profile_completeness", data.get("profileCompleteness", 0.0)),
            "unique_ip_count": data.get("unique_ip_count", data.get("uniqueIpCount", 0)),
            "avg_comment_similarity": data.get("avg_comment_similarity", data.get("avgCommentSimilarity", 0.0)),
        }


class FakeAccountResponse(BaseModel):
    user_id: str
    is_fake: bool
    confidence: float


@router.post("", response_model=FakeAccountResponse)
async def score_user(req: UserFeatures) -> FakeAccountResponse:
    features = req.model_dump(exclude={"user_id"})
    result = predict(features)
    return FakeAccountResponse(
        user_id=req.user_id,
        is_fake=result["is_fake"],
        confidence=result["confidence"],
    )
