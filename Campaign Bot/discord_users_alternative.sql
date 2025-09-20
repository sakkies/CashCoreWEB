-- Alternative: If you want to use the existing 'profile' table instead
-- This will add Discord-specific columns to your existing profile table

-- Add Discord-specific columns to existing profile table
ALTER TABLE profile 
ADD COLUMN IF NOT EXISTS discord_id VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS discord_username VARCHAR(50),
ADD COLUMN IF NOT EXISTS display_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_discord_id ON profile(discord_id);

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to profile table (if not already exists)
DROP TRIGGER IF EXISTS update_profile_updated_at ON profile;
CREATE TRIGGER update_profile_updated_at
    BEFORE UPDATE ON profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (if not already granted)
GRANT ALL ON profile TO authenticated;
GRANT ALL ON profile TO service_role;
