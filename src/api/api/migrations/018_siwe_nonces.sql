-- SIWE nonce replay protection (PostgreSQL-backed, replacing Redis dependency)
CREATE TABLE IF NOT EXISTS siwe_nonces (
    nonce VARCHAR(255) PRIMARY KEY,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_siwe_nonces_expires ON siwe_nonces(expires_at);
