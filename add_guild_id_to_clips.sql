-- Add discord_guild_id column to clips table to track which server each clip was uploaded from

-- Add discord_guild_id column to store the Discord server ID where the clip was uploaded
ALTER TABLE clips 
ADD COLUMN IF NOT EXISTS discord_guild_id VARCHAR(20) DEFAULT NULL;

-- Add comment for the new column
COMMENT ON COLUMN clips.discord_guild_id IS 'Discord server ID where the clip was uploaded from';

-- Add index for better performance when filtering by server
CREATE INDEX IF NOT EXISTS idx_clips_guild_id ON clips(discord_guild_id);

-- Add index for combined guild_id and campaign_name queries
CREATE INDEX IF NOT EXISTS idx_clips_guild_campaign ON clips(discord_guild_id, campaign_name);
