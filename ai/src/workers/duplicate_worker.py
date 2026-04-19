"""
Celery worker: duplicate comment detection via pgvector cosine similarity.

Task: detect_duplicate(comment_id, text)
  1. Embed text with paraphrase-multilingual-MiniLM-L12-v2
  2. Upsert embedding into comment_embeddings table
  3. Query cosine_similarity > threshold against last 10k comments
  4. Return { is_duplicate, duplicate_of }
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import numpy as np
from celery import Task
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from src.config import settings
from src.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

_engine = create_async_engine(settings.database_url, pool_pre_ping=True)
_session_factory = async_sessionmaker(_engine, expire_on_commit=False)

# Lazy-loaded embedding model (loaded once per worker process)
_embedder = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer(settings.embedding_model)
    return _embedder


async def _upsert_and_query(comment_id: int, embedding: list[float]) -> dict[str, Any]:
    vec_str = "[" + ",".join(f"{v:.6f}" for v in embedding) + "]"
    async with _session_factory() as session:
        # Upsert current comment's embedding
        await session.execute(
            text("""
                INSERT INTO comment_embeddings (comment_id, embedding)
                VALUES (:cid, :emb::vector)
                ON CONFLICT (comment_id) DO UPDATE SET embedding = EXCLUDED.embedding
            """),
            {"cid": comment_id, "emb": vec_str},
        )
        await session.commit()

        # Find nearest neighbours (excluding self) within last 10k rows
        result = await session.execute(
            text("""
                SELECT comment_id,
                       1 - (embedding <=> :emb::vector) AS similarity
                FROM comment_embeddings
                WHERE comment_id != :cid
                ORDER BY embedding <=> :emb::vector
                LIMIT :window
            """),
            {"emb": vec_str, "cid": comment_id, "window": settings.duplicate_window_size},
        )
        rows = result.fetchall()

    for row in rows:
        if row.similarity >= settings.duplicate_similarity_threshold:
            return {"is_duplicate": True, "duplicate_of": int(row.comment_id)}

    return {"is_duplicate": False, "duplicate_of": None}


@celery_app.task(bind=True, name="src.workers.duplicate_worker.detect_duplicate", max_retries=3)
def detect_duplicate(self: Task, comment_id: int, text_content: str) -> dict[str, Any]:
    """Embed `text_content`, store in pgvector, return duplicate signal."""
    try:
        embedder = _get_embedder()
        embedding: list[float] = embedder.encode(text_content, normalize_embeddings=True).tolist()
        return asyncio.get_event_loop().run_until_complete(
            _upsert_and_query(comment_id, embedding)
        )
    except Exception as exc:
        logger.exception("detect_duplicate failed for comment_id=%s", comment_id)
        raise self.retry(exc=exc, countdown=10)


@celery_app.task(name="src.workers.duplicate_worker.retrain_models")
def retrain_models() -> dict[str, str]:
    """Placeholder weekly retraining task triggered by MLflow accuracy check."""
    logger.info("Retraining triggered — implement per-model logic here.")
    return {"status": "retraining_enqueued"}
