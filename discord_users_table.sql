-- Create Discord users table for CashCore bot
-- This table will store user data when they click the "Start Clipping" button

CREATE TABLE IF NOT EXISTS discord_users (
    id BIGSERIAL PRIMARY KEY,
    discord_id VARCHAR(20) UNIQUE NOT NULL,
    discord_username VARCHAR(50) NOT NULL,
    display_name VARCHAR(50),
    email VARCHAR(255),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_discord_users_discord_id ON discord_users(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_users_username ON discord_users(discord_username);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to discord_users table
DROP TRIGGER IF EXISTS update_discord_users_updated_at ON discord_users;
CREATE TRIGGER update_discord_users_updated_at
    BEFORE UPDATE ON discord_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE discord_users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow users to read their own data
CREATE POLICY "Users can view own data" ON discord_users
    FOR SELECT USING (true);

-- Allow service role to insert/update (for bot operations)
CREATE POLICY "Service role can manage all data" ON discord_users
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON discord_users TO authenticated;
GRANT ALL ON discord_users TO service_role;
GRANT USAGE, SELECT ON SEQUENCE discord_users_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE discord_users_id_seq TO service_role;

-- Optional: Create a view for easy querying
CREATE OR REPLACE VIEW discord_users_summary AS
SELECT 
    discord_id,
    discord_username,
    display_name,
    email,
    last_activity,
    created_at,
    CASE 
        WHEN last_activity > NOW() - INTERVAL '7 days' THEN 'Active'
        WHEN last_activity > NOW() - INTERVAL '30 days' THEN 'Inactive'
        ELSE 'Dormant'
    END as activity_status
FROM discord_users
ORDER BY last_activity DESC;

-- Grant access to the view
GRANT SELECT ON discord_users_summary TO authenticated;
GRANT SELECT ON discord_users_summary TO service_role;
