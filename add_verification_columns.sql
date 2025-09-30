-- Add verification tracking columns to user_accounts table
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS verification_code_found VARCHAR(20),
ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_error TEXT,
ADD COLUMN IF NOT EXISTS bio_text TEXT;

-- Create index for faster verification queries
CREATE INDEX IF NOT EXISTS idx_user_accounts_verification 
ON user_accounts (verified, last_verification_attempt);

-- Create index for Discord user lookups
CREATE INDEX IF NOT EXISTS idx_user_accounts_discord_id 
ON user_accounts (discord_id);
