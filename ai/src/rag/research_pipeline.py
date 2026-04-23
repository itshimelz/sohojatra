"""
LlamaIndex RAG pipeline over pgvector.

research_match(concern_text, top_k=3)
  → list of { title, snippet, relevance_score }

On first call the index is built (or loaded) from the pgvector store.
Documents are expected to be pre-indexed via index_documents().
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from src.config import settings

logger = logging.getLogger(__name__)

_index = None  # module-level LlamaIndex VectorStoreIndex


def _build_index():
    """Build or connect to the pgvector index (called once at startup)."""
    from llama_index.core import VectorStoreIndex, StorageContext
    from llama_index.vector_stores.postgres import PGVectorStore
    import sqlalchemy

    # Sync connection string for LlamaIndex (uses psycopg2 under the hood)
    sync_url = settings.database_url.replace("+asyncpg", "")

    vector_store = PGVectorStore.from_params(
        connection_string=sync_url,
        table_name="research_documents",
        embed_dim=384,  # paraphrase-multilingual-MiniLM-L12-v2 output dim
    )
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex.from_vector_store(
        vector_store, storage_context=storage_context
    )
    return index


def _get_index():
    global _index
    if _index is None:
        _index = _build_index()
    return _index


async def research_match(
    concern_text: str,
    top_k: int = 3,
) -> list[dict[str, Any]]:
    """
    Async wrapper — LlamaIndex query runs in a thread pool to avoid blocking.
    Returns list of { title, snippet, relevance_score }.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_match, concern_text, top_k)


def _sync_match(concern_text: str, top_k: int) -> list[dict[str, Any]]:
    try:
        index = _get_index()
        retriever = index.as_retriever(similarity_top_k=top_k)
        nodes = retriever.retrieve(concern_text)

        results = []
        for node in nodes:
            meta = node.metadata or {}
            results.append({
                "title": meta.get("title", "Untitled"),
                "snippet": node.get_content()[:300],
                "relevance_score": round(float(node.score or 0.0), 4),
            })
        return results
    except Exception as exc:
        logger.warning("research_match failed: %s", exc)
        return []


async def index_documents(documents: list[dict[str, Any]]) -> int:
    """
    Ingest research documents into the pgvector store.
    documents: list of { title, text, metadata? }
    Returns count of documents indexed.
    """
    from llama_index.core import Document

    loop = asyncio.get_event_loop()

    def _ingest():
        from llama_index.core import VectorStoreIndex, StorageContext
        from llama_index.vector_stores.postgres import PGVectorStore

        sync_url = settings.database_url.replace("+asyncpg", "")
        vector_store = PGVectorStore.from_params(
            connection_string=sync_url,
            table_name="research_documents",
            embed_dim=384,
        )
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        docs = [
            Document(
                text=d["text"],
                metadata={"title": d.get("title", ""), **(d.get("metadata") or {})},
            )
            for d in documents
        ]
        VectorStoreIndex.from_documents(docs, storage_context=storage_context)
        return len(docs)

    return await loop.run_in_executor(None, _ingest)
