"""
POST /collect-feedback
Enqueues a Celery task to call Modal API on the given comment text
and store the prediction in training_feedback for future retraining.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.workers.retrain_worker import collect_feedback

router = APIRouter(prefix="/collect-feedback", tags=["mlops"])


class FeedbackRequest(BaseModel):
    comment_id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1, max_length=4096)


@router.post("")
async def enqueue_feedback(req: FeedbackRequest) -> dict:
    collect_feedback.delay(req.comment_id, req.text)
    return {"queued": True, "comment_id": req.comment_id}
