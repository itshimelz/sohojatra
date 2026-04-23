-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Comment embeddings table for duplicate detection
CREATE TABLE IF NOT EXISTS comment_embeddings (
    comment_id  BIGINT PRIMARY KEY,
    embedding   vector(384) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS comment_embeddings_hnsw
    ON comment_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Research documents table for RAG
CREATE TABLE IF NOT EXISTS research_documents (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    embedding   vector(384),
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS research_documents_hnsw
    ON research_documents
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- MLflow backend tables are created automatically by mlflow server
