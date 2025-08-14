-- Migration to add Auth.js v5 required fields to users table
-- This migration adds the missing columns needed for Auth.js v5 compatibility

-- Add Auth.js v5 required fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS image VARCHAR(500),
ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

-- Populate the new fields with data from existing fields
UPDATE users 
SET 
  name = COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), first_name, last_name, email),
  full_name = COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), first_name, last_name, email),
  "emailVerified" = CASE 
    WHEN email_verified = true THEN created_at 
    ELSE NULL 
  END,
  image = NULL,
  profile_picture_url = NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users("emailVerified");

-- Add constraints to ensure data consistency
-- Make name column not null after populating it
ALTER TABLE users ALTER COLUMN name SET NOT NULL;