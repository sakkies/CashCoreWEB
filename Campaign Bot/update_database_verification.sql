-- CashCore Verification System Database Updates
-- Run this script in your Supabase SQL editor

-- Add verification columns to user_accounts table
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_code_found VARCHAR(20),
ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_error TEXT,
ADD COLUMN IF NOT EXISTS bio_text TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_verification 
ON user_accounts (verified, last_verification_attempt);

CREATE INDEX IF NOT EXISTS idx_user_accounts_verification_code 
ON user_accounts (verification_code);

-- Update the existing discord_users table to include payment information
-- (These might already exist, but adding IF NOT EXISTS for safety)
ALTER TABLE discord_users 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_info TEXT;

-- Create a comprehensive view for verification status
CREATE OR REPLACE VIEW user_verification_status AS
SELECT 
    ua.discord_id,
    ua.platform,
    ua.username,
    ua.verification_code,
    ua.verified,
    ua.verification_code_found,
    ua.last_verification_attempt,
    ua.verification_error,
    ua.created_at as account_linked_at,
    du.discord_username,
    du.payment_method,
    du.payment_info,
    CASE 
        WHEN ua.verified = true THEN 'Verified'
        WHEN ua.last_verification_attempt IS NULL THEN 'Never Checked'
        WHEN ua.last_verification_attempt < NOW() - INTERVAL '24 hours' THEN 'Needs Re-check'
        ELSE 'Recently Checked'
    END as verification_status
FROM user_accounts ua
LEFT JOIN discord_users du ON ua.discord_id = du.discord_id
ORDER BY ua.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON user_verification_status TO authenticated;
GRANT SELECT ON user_verification_status TO service_role;

-- Create a function to get user's verification summary
CREATE OR REPLACE FUNCTION get_user_verification_summary(user_discord_id TEXT)
RETURNS TABLE (
    platform VARCHAR(32),
    username VARCHAR(100),
    verification_code VARCHAR(20),
    verified BOOLEAN,
    last_check TIMESTAMP WITH TIME ZONE,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.platform,
        ua.username,
        ua.verification_code,
        ua.verified,
        ua.last_verification_attempt,
        CASE 
            WHEN ua.verified = true THEN '✅ Verified'
            WHEN ua.last_verification_attempt IS NULL THEN '⏳ Never Checked'
            WHEN ua.last_verification_attempt < NOW() - INTERVAL '24 hours' THEN '🔄 Needs Re-check'
            ELSE '⏰ Recently Checked'
        END as status
    FROM user_accounts ua
    WHERE ua.discord_id = user_discord_id
    ORDER BY ua.platform, ua.username;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_verification_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_verification_summary(TEXT) TO service_role;

-- Create a trigger to automatically update verification status
CREATE OR REPLACE FUNCTION update_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_verification_attempt when verification_code changes
    IF NEW.verification_code IS DISTINCT FROM OLD.verification_code THEN
        NEW.last_verification_attempt = NULL;
        NEW.verified = FALSE;
    END IF;
    
    -- Update timestamp when verification status changes
    IF NEW.verified IS DISTINCT FROM OLD.verified THEN
        NEW.last_verification_attempt = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to user_accounts table
DROP TRIGGER IF EXISTS trg_update_verification_status ON user_accounts;
CREATE TRIGGER trg_update_verification_status
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_status();

-- Sample data for testing (optional - remove if not needed)
-- INSERT INTO discord_users (discord_id, discord_username, payment_method, payment_info) 
-- VALUES ('937652633806733332', 'testuser', 'ETH USDT', '0x1234567890abcdef')
-- ON CONFLICT (discord_id) DO NOTHING;

-- INSERT INTO user_accounts (discord_id, platform, username, verification_code)
-- VALUES ('937652633806733332', 'YouTube', 'testchannel', 'cashcore123456')
-- ON CONFLICT (discord_id, platform, username) DO NOTHING;

-- Verification queries for testing:
-- SELECT * FROM user_verification_status WHERE discord_id = '937652633806733332';
-- SELECT * FROM get_user_verification_summary('937652633806733332');


