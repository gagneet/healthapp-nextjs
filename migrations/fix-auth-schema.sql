-- Auth.js v5 Healthcare Platform Schema Migration
-- This script migrates from legacy auth system to Auth.js v5 compatibility
-- Run this after updating Prisma schema

BEGIN;

-- 1. Add missing Auth.js v5 fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS image VARCHAR(500),
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Migrate existing user data to Auth.js v5 format
-- Populate 'name' field with proper null handling
UPDATE users 
SET name = COALESCE(
  full_name,
  NULLIF(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')), ' '),
  SPLIT_PART(email, '@', 1)
)
WHERE name IS NULL;

-- Populate 'image' field from existing profile_picture_url
UPDATE users 
SET image = profile_picture_url 
WHERE profile_picture_url IS NOT NULL AND image IS NULL;

-- Migrate email verification status to datetime
UPDATE users 
SET email_verified_at = CASE 
  WHEN email_verified = true THEN COALESCE(created_at, NOW()) 
  ELSE NULL 
END
WHERE email_verified_at IS NULL;

-- 3. Make password_hash nullable for OAuth-only users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 4. Add healthcare-specific session tracking fields
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS healthcare_context JSON DEFAULT '{}';

-- 5. Add OAuth metadata to accounts table
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS provider_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Populate linked_at for existing accounts
UPDATE accounts 
SET linked_at = NOW() 
WHERE linked_at IS NULL;

-- 6. Create performance indexes for healthcare session management
CREATE INDEX IF NOT EXISTS idx_sessions_user_activity ON sessions(userId, last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_sessions_ip_address ON sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_accounts_user_provider ON accounts(userId, provider);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified_at);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- 7. Create healthcare audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    access_granted BOOLEAN NOT NULL DEFAULT true,
    user_role VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);

-- 8. Update user roles enum if needed (ensure healthcare roles exist)
-- This may need to be adjusted based on your existing enum_users_role type

-- 9. Create healthcare session security table for advanced tracking
CREATE TABLE IF NOT EXISTS healthcare_session_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) NOT NULL REFERENCES sessions(sessionToken) ON DELETE CASCADE,
    risk_score INTEGER DEFAULT 0,
    concurrent_sessions INTEGER DEFAULT 1,
    device_fingerprint TEXT,
    location_country VARCHAR(2),
    location_region VARCHAR(100),
    suspicious_activity BOOLEAN DEFAULT false,
    last_security_check TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create security tracking indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_session_security_token ON healthcare_session_security(session_token);
CREATE INDEX IF NOT EXISTS idx_healthcare_session_security_risk ON healthcare_session_security(risk_score);

-- 10. Clean up legacy email_verified boolean column (optional)
-- WARNING: Only run this after confirming migration worked correctly
-- ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

-- 11. Drop healthcare_sessions table if you chose unified approach
-- WARNING: Only run this after confirming all functionality moved to sessions table
-- DROP TABLE IF EXISTS healthcare_sessions CASCADE;

-- 12. Add constraints for data integrity
ALTER TABLE users ADD CONSTRAINT chk_users_name_not_empty 
    CHECK (name IS NULL OR LENGTH(TRIM(name)) > 0);

ALTER TABLE sessions ADD CONSTRAINT chk_sessions_expires_future 
    CHECK (expires > created_at);

-- 13. Create healthcare-specific functions for session management
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_accessed_at
DROP TRIGGER IF EXISTS trigger_update_session_activity ON sessions;
CREATE TRIGGER trigger_update_session_activity
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- 14. Grant appropriate permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO healthapp_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON healthcare_session_security TO healthapp_user;

COMMIT;

-- Verification queries (run these to verify migration)
-- SELECT COUNT(*) as total_users, 
--        COUNT(name) as users_with_name,
--        COUNT(image) as users_with_image,
--        COUNT(email_verified_at) as users_email_verified
-- FROM users;

-- SELECT COUNT(*) as total_sessions,
--        COUNT(ip_address) as sessions_with_ip,
--        COUNT(user_agent) as sessions_with_user_agent
-- FROM sessions;

-- SELECT COUNT(*) as total_accounts,
--        COUNT(provider_email) as accounts_with_provider_email
-- FROM accounts;