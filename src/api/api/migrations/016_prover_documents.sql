-- Migration 016: Prover Document Storage
-- Stores metadata for uploaded prover application documents (actual files in MinIO/S3)

CREATE TABLE IF NOT EXISTS prover_documents (
    doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prover_id TEXT NOT NULL REFERENCES provers(prover_id),
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prover_documents_prover_id ON prover_documents(prover_id);
