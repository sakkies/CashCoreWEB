-- Add image_url column to campaign_servers table
ALTER TABLE campaign_servers 
ADD COLUMN image_url VARCHAR(500);

-- Add campaign_name column to campaign_servers table (if it doesn't exist)
ALTER TABLE campaign_servers 
ADD COLUMN campaign_name VARCHAR(255);

-- Add comment to describe the columns
COMMENT ON COLUMN campaign_servers.image_url IS 'URL link to campaign image/banner';
COMMENT ON COLUMN campaign_servers.campaign_name IS 'Name of the campaign';
