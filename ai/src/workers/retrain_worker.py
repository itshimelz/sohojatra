"""
Celery worker: automatic retraining pipeline.

Tasks:
  collect_feedback(comment_id, text)
    - Calls Modal /analyze, stores urgency+emotion prediction in training_feedback table.

  check_retrain_threshold()  [Beat every 6 hours]
    - If unused training_feedback rows >= RETRAIN_THRESHOLD, enqueues export_and_retrain.

  export_and_retrain()
    - Fetches unused rows, converts to ChatML JSONL, pushes to HuggingFace Hub dataset,
      marks rows as used.  Kaggle notebook pulls the updated dataset on next run.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile
from datetime import datetime
from typing import Any

import httpx
from celery import Task
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from src.config import settings
from src.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

RETRAIN_THRESHOLD = int(os.getenv("RETRAIN_THRESHOLD", "50"))
HF_REPO_ID = os.getenv("HF_DATASET_REPO", "Emon3412/sohojatra-dataset")
HF_TOKEN = settings.huggingface_token

_engine = create_async_engine(settings.async_database_url, pool_pre_ping=True)
_session_factory = async_sessionmaker(_engine, expire_on_commit=False)


# ── collect_feedback ─────────────────────────────────────────────────────────

async def _call_modal(text_content: str, task: str) -> dict[str, Any]:
    if not settings.modal_api_url:
        return {}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            settings.modal_api_url,
            json={"text": text_content, "task": task},
        )
        resp.raise_for_status()
        return resp.json()


async def _store_feedback(
    comment_id: str,
    text_content: str,
    urgency: str | None,
    emotions: dict | None,
) -> None:
    async with _session_factory() as session:
        await session.execute(
            text("""
                INSERT INTO training_feedback
                    (id, text, predicted_urgency, predicted_emotions, source, source_id, used, created_at)
                VALUES
                    (gen_random_uuid()::text, :txt, :urgency, :emotions::jsonb, 'comment', :src_id, false, now())
            """),
            {
                "txt": text_content,
                "urgency": urgency,
                "emotions": json.dumps(emotions) if emotions else "{}",
                "src_id": str(comment_id),
            },
        )
        await session.commit()


@celery_app.task(bind=True, name="src.workers.retrain_worker.collect_feedback", max_retries=2)
def collect_feedback(self: Task, comment_id: str, text_content: str) -> dict[str, Any]:
    """Call Modal API on new comment text and store prediction for future retraining."""
    try:
        urgency_res = asyncio.run(_call_modal(text_content, "urgency"))
        emotion_res = asyncio.run(_call_modal(text_content, "emotion"))

        urgency = urgency_res.get("label") or urgency_res.get("urgency")
        emotions = emotion_res.get("emotions") or emotion_res.get("label")

        asyncio.run(_store_feedback(comment_id, text_content, urgency, emotions))
        return {"stored": True, "urgency": urgency}
    except Exception as exc:
        logger.warning("collect_feedback failed for comment_id=%s: %s", comment_id, exc)
        raise self.retry(exc=exc, countdown=30)


# ── check_retrain_threshold ──────────────────────────────────────────────────

async def _count_unused() -> int:
    async with _session_factory() as session:
        result = await session.execute(
            text("SELECT COUNT(*) FROM training_feedback WHERE used = false")
        )
        return result.scalar_one()


@celery_app.task(name="src.workers.retrain_worker.check_retrain_threshold")
def check_retrain_threshold() -> dict[str, Any]:
    """Beat task (every 6 h): trigger export_and_retrain when enough new data exists."""
    count = asyncio.run(_count_unused())
    logger.info("Unused training_feedback rows: %d (threshold: %d)", count, RETRAIN_THRESHOLD)
    if count >= RETRAIN_THRESHOLD:
        export_and_retrain.delay()
        return {"triggered": True, "count": count}
    return {"triggered": False, "count": count}


# ── export_and_retrain ───────────────────────────────────────────────────────

async def _fetch_and_mark_used() -> list[dict]:
    async with _session_factory() as session:
        result = await session.execute(
            text("""
                SELECT id, text, predicted_urgency, predicted_emotions
                FROM training_feedback
                WHERE used = false
                ORDER BY created_at
                LIMIT 500
            """)
        )
        rows = result.fetchall()

        ids = [r.id for r in rows]
        if ids:
            await session.execute(
                text("UPDATE training_feedback SET used = true WHERE id = ANY(:ids)"),
                {"ids": ids},
            )
            await session.commit()

        return [
            {
                "id": r.id,
                "text": r.text,
                "urgency": r.predicted_urgency,
                "emotions": r.predicted_emotions,
            }
            for r in rows
        ]


def _rows_to_chatml(rows: list[dict]) -> list[dict]:
    """Convert feedback rows to ChatML conversation format for SFTTrainer."""
    samples = []
    for r in rows:
        if not r["urgency"]:
            continue
        emotions_str = json.dumps(r["emotions"]) if r["emotions"] else "unknown"
        samples.append({
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a civic concern analyzer. "
                        "Assess urgency (low/medium/high/critical) and emotions."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Analyze: {r['text']}",
                },
                {
                    "role": "assistant",
                    "content": (
                        f"Urgency: {r['urgency']}\n"
                        f"Emotions: {emotions_str}"
                    ),
                },
            ]
        })
    return samples


def _push_to_hub(samples: list[dict]) -> str:
    """Write JSONL and upload to HuggingFace Hub dataset repo."""
    from huggingface_hub import HfApi

    api = HfApi(token=HF_TOKEN)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"feedback_{timestamp}.jsonl"

    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
        for sample in samples:
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")
        tmp_path = f.name

    api.upload_file(
        path_or_fileobj=tmp_path,
        path_in_repo=f"data/{filename}",
        repo_id=HF_REPO_ID,
        repo_type="dataset",
        commit_message=f"Auto-feedback batch: {len(samples)} samples",
    )
    os.unlink(tmp_path)
    return filename


@celery_app.task(bind=True, name="src.workers.retrain_worker.export_and_retrain", max_retries=1)
def export_and_retrain(self: Task) -> dict[str, Any]:
    """Export unused feedback to HuggingFace Hub dataset for next Kaggle training run."""
    try:
        rows = asyncio.run(_fetch_and_mark_used())
        if not rows:
            return {"status": "no_data"}

        samples = _rows_to_chatml(rows)
        if not samples:
            return {"status": "no_valid_samples", "raw_rows": len(rows)}

        filename = _push_to_hub(samples)
        logger.info("Pushed %d samples to Hub as %s", len(samples), filename)
        return {"status": "pushed", "samples": len(samples), "file": filename}
    except Exception as exc:
        logger.exception("export_and_retrain failed")
        raise self.retry(exc=exc, countdown=60)
