-- Migration: add_vector_tables
-- Adds comment_embeddings and research_documents tables for the Nagarik AI
-- microservice (duplicate detection and RAG).
--
-- NOTE: The `vector` extension is already enabled on Supabase and is NOT
-- created here. If running against a fresh PostgreSQL instance (not Supabase),
-- run `CREATE EXTENSION IF NOT EXISTS vector;` manually before this migration.

-- ── comment_embeddings ────────────────────────────────────────────────────────
-- Stores 384-dim sentence-transformer embeddings for duplicate comment detection.
-- Used by ai/src/workers/duplicate_worker.py (Celery task).

CREATE TABLE IF NOT EXISTS "comment_embeddings" (
    "comment_id" BIGINT       NOT NULL,
    "embedding"  vector(384)  NOT NULL,
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "comment_embeddings_pkey" PRIMARY KEY ("comment_id")
);

-- HNSW index for fast approximate cosine-similarity search.
-- Prisma does not support custom index types — created here explicitly.
CREATE INDEX IF NOT EXISTS "comment_embeddings_hnsw"
    ON "comment_embeddings"
    USING hnsw ("embedding" vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ── research_documents ────────────────────────────────────────────────────────
-- Stores research documents with embeddings for LlamaIndex RAG pipeline.
-- Used by ai/src/rag/research_pipeline.py.

CREATE TABLE IF NOT EXISTS "research_documents" (
    "id"         SERIAL       NOT NULL,
    "title"      TEXT         NOT NULL,
    "content"    TEXT         NOT NULL,
    "embedding"  vector(384),
    "metadata"   JSONB        NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "research_documents_pkey" PRIMARY KEY ("id")
);

-- HNSW index for fast approximate cosine-similarity search.
CREATE INDEX IF NOT EXISTS "research_documents_hnsw"
    ON "research_documents"
    USING hnsw ("embedding" vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Row-level security: these tables contain AI-internal data only.
-- Block direct access from the Supabase anon/authenticated roles.
ALTER TABLE "comment_embeddings"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "research_documents"  ENABLE ROW LEVEL SECURITY;

-- Only the service_role (used by the AI microservice) can read/write.
CREATE POLICY "ai_service_only" ON "comment_embeddings"
    AS RESTRICTIVE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "ai_service_only" ON "research_documents"
    AS RESTRICTIVE
    TO service_role
    USING (true)
    WITH CHECK (true);
