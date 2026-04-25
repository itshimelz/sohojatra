"""
POST /collect-feedback
Enqueues a Celery task to call Modal API on the given comment text
and store the prediction in training_feedback for future retraining.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator

router = APIRouter(prefix="/collect-feedback", tags=["mlops"])


class FeedbackRequest(BaseModel):
    comment_id: str = Field(default="unknown-comment", min_length=1)
    text: str = Field(default="", max_length=4096)

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data):
        if not isinstance(data, dict):
            return data
        text = data.get("text")
        if text is None:
            text = data.get("comment") or data.get("body") or ""
        return {
            **data,
            "comment_id": str(data.get("comment_id") or data.get("commentId") or "unknown-comment"),
            "text": str(text).strip(),
        }


@router.post("")
async def enqueue_feedback(req: FeedbackRequest) -> dict:
    if not req.text:
        return {"queued": False, "comment_id": req.comment_id, "reason": "text is required"}
    try:
        from src.workers.retrain_worker import collect_feedback

        collect_feedback.delay(req.comment_id, req.text)
        return {"queued": True, "comment_id": req.comment_id}
    except Exception:
        # Keep endpoint available even when Celery/worker stack is not configured.
        return {"queued": False, "comment_id": req.comment_id, "reason": "worker not configured"}
