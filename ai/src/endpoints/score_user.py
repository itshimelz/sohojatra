"""POST /score_user — fake account detection endpoint."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.mlops.tracker import log_call
from src.models.fake_account_classifier import predict

router = APIRouter(prefix="/score_user", tags=["moderation"])


class UserFeatures(BaseModel):
    user_id: str
    account_age_days: int = Field(..., ge=0)
    posts_per_day: float = Field(..., ge=0.0)
    profile_completeness: float = Field(..., ge=0.0, le=1.0)
    unique_ip_count: int = Field(..., ge=0)
    avg_comment_similarity: float = Field(..., ge=0.0, le=1.0)
    verified: bool = False


class FakeAccountResponse(BaseModel):
    user_id: str
    is_fake: bool
    confidence: float


@router.post("", response_model=FakeAccountResponse)
@log_call(model_name="fake_account_xgb")
async def score_user(req: UserFeatures) -> FakeAccountResponse:
    features = req.model_dump(exclude={"user_id"})
    result = predict(features)
    return FakeAccountResponse(
        user_id=req.user_id,
        is_fake=result["is_fake"],
        confidence=result["confidence"],
    )
