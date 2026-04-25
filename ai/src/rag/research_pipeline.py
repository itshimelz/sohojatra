"""
LlamaIndex RAG pipeline over pgvector — STUB.

When llama-index is not installed, research_match returns an empty list
so the /match_research endpoint stays available without crashing.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


async def research_match(
    concern_text: str,
    top_k: int = 3,
) -> list[dict[str, Any]]:
    logger.info("research_match called but llama-index is not installed — returning empty results")
    return []
