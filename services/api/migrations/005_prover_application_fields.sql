-- Migration 005: Add application fields to provers table
-- These fields capture the full application form data from Prover registration

-- Add new columns to provers table
ALTER TABLE provers ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255);
ALTER TABLE provers ADD COLUMN IF NOT EXISTS country VARCHAR(2);
ALTER TABLE provers ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE provers ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE provers ADD COLUMN IF NOT EXISTS validator_experience TEXT;
ALTER TABLE provers ADD COLUMN IF NOT EXISTS hsm_provider VARCHAR(100);
ALTER TABLE provers ADD COLUMN IF NOT EXISTS infrastructure_location VARCHAR(100);
ALTER TABLE provers ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100);
ALTER TABLE provers ADD COLUMN IF NOT EXISTS documents_count INTEGER DEFAULT 0;

-- Add index for organization name search
CREATE INDEX IF NOT EXISTS idx_provers_organization_name ON provers(organization_name);

-- Add index for contact email
CREATE INDEX IF NOT EXISTS idx_provers_contact_email ON provers(contact_email);
