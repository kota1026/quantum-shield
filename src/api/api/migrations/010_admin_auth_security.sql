-- Phase 3: Admin Auth Security Fixes
-- Resolves: S-1 (signature verification), S-2 (TOTP), S-3 (refresh token validation)
--
-- Adds refresh_token_hash column to admin_sessions for secure token rotation.
-- The hash is SHA-256 of the refresh token, enabling DB-side validation
-- without storing the raw token.

-- ============================================================================
-- Admin Sessions - Add refresh_token_hash for S-3 (Refresh Token DB Validation)
-- ============================================================================

ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(64);

-- Index for fast refresh token lookup
CREATE INDEX IF NOT EXISTS idx_admin_sessions_refresh_hash
    ON admin_sessions(refresh_token_hash)
    WHERE refresh_token_hash IS NOT NULL AND revoked_at IS NULL;
