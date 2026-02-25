-- Migration 013: System Settings table
-- Provides persistent storage for protocol-wide settings (e.g., emergency pause state).
-- Replaces hardcoded values with PG-backed state per SM-001 (PG is Source of Truth).

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by VARCHAR(42),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize protocol state (not paused)
INSERT INTO system_settings (key, value)
VALUES ('protocol_state', '{"paused": false}'::jsonb)
ON CONFLICT DO NOTHING;

-- Emergency pause history for audit trail
CREATE TABLE IF NOT EXISTS emergency_pause_history (
    pause_id VARCHAR(64) PRIMARY KEY,
    reason TEXT NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'full',
    paused_at TIMESTAMP WITH TIME ZONE NOT NULL,
    unpaused_at TIMESTAMP WITH TIME ZONE,
    duration_secs BIGINT DEFAULT 0,
    was_extended BOOLEAN DEFAULT FALSE,
    initiated_by VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pause_history_paused_at
    ON emergency_pause_history (paused_at DESC);
