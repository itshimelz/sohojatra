"""POST /detect_mob — mob / coordinated-behaviour detection."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator

from src.models.mob_detector import detect_mob

router = APIRouter(prefix="/detect_mob", tags=["moderation"])


class InteractionEvent(BaseModel):
    user_id: str = "anonymous"
    post_id: str = "unknown-post"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode="before")
    @classmethod
    def normalize_event(cls, data):
        if not isinstance(data, dict):
            return data
        return {
            **data,
            "user_id": str(data.get("user_id") or data.get("userId") or "anonymous"),
            "post_id": str(data.get("post_id") or data.get("postId") or "unknown-post"),
            "created_at": data.get("created_at") or data.get("createdAt") or datetime.now(timezone.utc).isoformat(),
        }


class MobDetectRequest(BaseModel):
    events: list[InteractionEvent] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data):
        if not isinstance(data, dict):
            return data
        # Compatibility: accept a single signal/text payload without events.
        signal = data.get("signal") or data.get("text")
        if signal and not data.get("events"):
            return {
                **data,
                "events": [
                    {
                        "user_id": "signal-user",
                        "post_id": f"signal-{hash(str(signal)) % 100000}",
                    }
                ],
            }
        return data


class MobDetectResponse(BaseModel):
    mob_detected: bool
    cluster_ids: list[list[str]]
    confidence: float


@router.post("", response_model=MobDetectResponse)
async def detect_mob_endpoint(req: MobDetectRequest) -> MobDetectResponse:
    if not req.events:
        return MobDetectResponse(mob_detected=False, cluster_ids=[], confidence=0.0)
    events = [e.model_dump() for e in req.events]
    result = detect_mob(events)
    return MobDetectResponse(**result)
