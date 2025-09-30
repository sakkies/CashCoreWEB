-- Create campaign_servers table to map Discord servers to campaigns
CREATE TABLE IF NOT EXISTS campaign_servers (
    id BIGSERIAL PRIMARY KEY,
    campaign_name VARCHAR(100) NOT NULL,
    discord_guild_id VARCHAR(20) UNIQUE NOT NULL,
    discord_guild_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_servers_guild_id ON campaign_servers(discord_guild_id);
CREATE INDEX IF NOT EXISTS idx_campaign_servers_campaign_name ON campaign_servers(campaign_name);
CREATE INDEX IF NOT EXISTS idx_campaign_servers_active ON campaign_servers(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_campaign_servers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to campaign_servers table
DROP TRIGGER IF EXISTS update_campaign_servers_updated_at ON campaign_servers;
CREATE TRIGGER update_campaign_servers_updated_at
    BEFORE UPDATE ON campaign_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_servers_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE campaign_servers ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow service role to manage all data
CREATE POLICY "Service role can manage campaign servers" ON campaign_servers
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON campaign_servers TO authenticated;
GRANT ALL ON campaign_servers TO service_role;
GRANT USAGE, SELECT ON SEQUENCE campaign_servers_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE campaign_servers_id_seq TO service_role;

-- Insert some example campaigns (you can modify these)
INSERT INTO campaign_servers (campaign_name, discord_guild_id, discord_guild_name) VALUES
('General Submission', '0', 'Default Campaign'),
('Summer Campaign 2024', '123456789012345678', 'Summer Campaign Server'),
('Holiday Special', '987654321098765432', 'Holiday Campaign Server')
ON CONFLICT (discord_guild_id) DO NOTHING;





