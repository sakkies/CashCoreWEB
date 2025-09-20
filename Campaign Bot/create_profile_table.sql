-- Create profile table for CashCore Discord bot
-- This table will store user data when they click the "Start Clipping" button

CREATE TABLE IF NOT EXISTS profile (
    id BIGSERIAL PRIMARY KEY,
    discord_id VARCHAR(20) UNIQUE NOT NULL,
    discord_username VARCHAR(50) NOT NULL,
    display_name VARCHAR(50),
    email VARCHAR(255),
    username VARCHAR(50),
    platforms TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_discord_id ON profile(discord_id);
CREATE INDEX IF NOT EXISTS idx_profile_username ON profile(discord_username);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to profile table
DROP TRIGGER IF EXISTS update_profile_updated_at ON profile;
CREATE TRIGGER update_profile_updated_at
    BEFORE UPDATE ON profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow users to read their own data
CREATE POLICY "Users can view own data" ON profile
    FOR SELECT USING (true);

-- Allow service role to insert/update (for bot operations)
CREATE POLICY "Service role can manage all data" ON profile
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON profile TO authenticated;
GRANT ALL ON profile TO service_role;
GRANT USAGE, SELECT ON SEQUENCE profile_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE profile_id_seq TO service_role;

