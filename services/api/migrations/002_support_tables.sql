-- Support Tables Migration
-- Version: 1.1
-- Adds: support_tickets, faqs, announcements tables for Phase 8-C

-- ============================================================================
-- Support Tickets Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id VARCHAR(66) PRIMARY KEY,
    user_wallet VARCHAR(42) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    assigned_to VARCHAR(66) REFERENCES admin_users(admin_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tickets_wallet ON support_tickets(user_wallet);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON support_tickets(created_at DESC);

COMMENT ON TABLE support_tickets IS 'User support tickets for QS Admin';
COMMENT ON COLUMN support_tickets.category IS 'Category: general, technical, billing, security';
COMMENT ON COLUMN support_tickets.priority IS 'Priority: low, medium, high, critical';
COMMENT ON COLUMN support_tickets.status IS 'Status: open, in_progress, waiting, resolved, closed';

-- ============================================================================
-- FAQs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS faqs (
    faq_id VARCHAR(66) PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(is_published);
CREATE INDEX IF NOT EXISTS idx_faqs_sort ON faqs(category, sort_order);

COMMENT ON TABLE faqs IS 'Frequently Asked Questions for help center';
COMMENT ON COLUMN faqs.category IS 'Category: general, lock, unlock, prover, governance, token';

-- ============================================================================
-- Announcements Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id VARCHAR(66) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'info',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(66) NOT NULL REFERENCES admin_users(admin_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

COMMENT ON TABLE announcements IS 'System announcements for users';
COMMENT ON COLUMN announcements.category IS 'Category: info, maintenance, security, feature, urgent';
COMMENT ON COLUMN announcements.priority IS 'Priority: low, normal, high, urgent';

-- ============================================================================
-- Sample Data for Testing
-- ============================================================================

-- Sample FAQ entries
INSERT INTO faqs (faq_id, question, answer, category, sort_order, is_published, created_at, updated_at)
VALUES
    ('faq-001', 'What is Quantum Shield?', 'Quantum Shield is a post-quantum secure bridge protocol that protects your assets using Dilithium and SPHINCS+ signatures.', 'general', 1, true, NOW(), NOW()),
    ('faq-002', 'How do I lock assets?', 'Connect your wallet, select the amount to lock, and sign the transaction. Your assets will be secured with quantum-resistant cryptography.', 'lock', 1, true, NOW(), NOW()),
    ('faq-003', 'What is the 24-hour waiting period?', 'The 24-hour waiting period is a security measure that allows observers to verify unlock requests before execution.', 'unlock', 1, true, NOW(), NOW()),
    ('faq-004', 'How do I become a prover?', 'Stake the required QS tokens, set up HSM hardware, and submit a registration request through the Prover Portal.', 'prover', 1, true, NOW(), NOW()),
    ('faq-005', 'What is veQS?', 'veQS (vote-escrowed QS) is a governance token obtained by locking QS tokens. It grants voting power and protocol rewards.', 'token', 1, true, NOW(), NOW())
ON CONFLICT (faq_id) DO NOTHING;
