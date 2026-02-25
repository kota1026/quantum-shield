-- Migration 011: Enterprise Tables
-- Enterprise Organizations, Users, API Keys, Applications, Audit Log, Settings

-- Enterprise Organizations
CREATE TABLE IF NOT EXISTS enterprise_organizations (
    org_id VARCHAR(66) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    display_name VARCHAR(200),
    plan VARCHAR(30) NOT NULL DEFAULT 'enterprise',
    logo_url TEXT,
    website TEXT,
    support_email VARCHAR(200),
    timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise Users
CREATE TABLE IF NOT EXISTS enterprise_users (
    user_id VARCHAR(66) PRIMARY KEY,
    org_id VARCHAR(66) NOT NULL REFERENCES enterprise_organizations(org_id),
    email VARCHAR(200) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    wallet_address VARCHAR(42),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMP WITH TIME ZONE,
    invited_by VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ent_users_org ON enterprise_users(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_users_email ON enterprise_users(email);

-- Enterprise API Keys
CREATE TABLE IF NOT EXISTS enterprise_api_keys (
    key_id VARCHAR(66) PRIMARY KEY,
    org_id VARCHAR(66) NOT NULL REFERENCES enterprise_organizations(org_id),
    name VARCHAR(200) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,
    key_preview VARCHAR(20) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    ip_whitelist JSONB,
    last_used TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(66) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_ent_keys_org ON enterprise_api_keys(org_id);

-- Enterprise Applications
CREATE TABLE IF NOT EXISTS enterprise_applications (
    application_id VARCHAR(66) PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    website TEXT,
    contact_name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(200) NOT NULL,
    contact_phone VARCHAR(50),
    job_title VARCHAR(200) NOT NULL,
    expected_volume VARCHAR(100),
    use_case TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    review_notes TEXT,
    assigned_reviewer VARCHAR(200),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ent_app_status ON enterprise_applications(status);

-- Enterprise Audit Log
CREATE TABLE IF NOT EXISTS enterprise_audit_log (
    audit_id VARCHAR(66) PRIMARY KEY,
    org_id VARCHAR(66) REFERENCES enterprise_organizations(org_id),
    user_id VARCHAR(66),
    user_name VARCHAR(200),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ent_audit_org ON enterprise_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_audit_created ON enterprise_audit_log(created_at DESC);

-- Enterprise Settings (per org)
CREATE TABLE IF NOT EXISTS enterprise_settings (
    org_id VARCHAR(66) PRIMARY KEY REFERENCES enterprise_organizations(org_id),
    notification_email_alerts BOOLEAN DEFAULT TRUE,
    notification_slack BOOLEAN DEFAULT FALSE,
    notification_webhook_url TEXT,
    alert_large_tx VARCHAR(100) DEFAULT '100',
    alert_daily_volume VARCHAR(100) DEFAULT '10000',
    max_transaction_size VARCHAR(100) DEFAULT '1000',
    daily_transaction_limit VARCHAR(100) DEFAULT '50000',
    api_rate_limit INTEGER DEFAULT 1000,
    two_factor_required BOOLEAN DEFAULT TRUE,
    session_timeout INTEGER DEFAULT 60,
    ip_whitelist_enabled BOOLEAN DEFAULT FALSE,
    ip_whitelist JSONB DEFAULT '[]',
    password_min_length INTEGER DEFAULT 12,
    password_require_uppercase BOOLEAN DEFAULT TRUE,
    password_require_numbers BOOLEAN DEFAULT TRUE,
    password_require_special BOOLEAN DEFAULT TRUE,
    password_max_age INTEGER DEFAULT 90,
    audit_log_retention INTEGER DEFAULT 365,
    signing_key_rotation INTEGER DEFAULT 90,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
