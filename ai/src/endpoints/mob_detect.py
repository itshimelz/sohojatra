"""POST /detect_mob — mob / coordinated-behaviour detection."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.mlops.tracker import log_call
from src.models.mob_detector import detect_mob

router = APIRouter(prefix="/detect_mob", tags=["moderation"])


class InteractionEvent(BaseModel):
    user_id: str
    post_id: str
    created_at: datetime


class MobDetectRequest(BaseModel):
    events: list[InteractionEvent] = Field(..., min_length=1)


class MobDetectResponse(BaseModel):
    mob_detected: bool
    cluster_ids: list[list[str]]
    confidence: float


@router.post("", response_model=MobDetectResponse)
@log_call(model_name="mob_detector_networkx")
async def detect_mob_endpoint(req: MobDetectRequest) -> MobDetectResponse:
    events = [e.model_dump() for e in req.events]
    result = detect_mob(events)
    return MobDetectResponse(**result)
