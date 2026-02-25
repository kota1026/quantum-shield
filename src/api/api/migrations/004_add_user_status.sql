-- Add status column to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_user_settings_status ON user_settings(status);

-- Comment
COMMENT ON COLUMN user_settings.status IS 'User account status: active, inactive, suspended';
