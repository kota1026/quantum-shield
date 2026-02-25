-- L1 Sync State Table
-- Tracks the last synced block for L1 event indexing

CREATE TABLE IF NOT EXISTS l1_sync_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    block_number BIGINT NOT NULL DEFAULT 0,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize with default value
INSERT INTO l1_sync_state (id, block_number) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_l1_sync_block ON l1_sync_state(block_number);
