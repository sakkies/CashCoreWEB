-- Add platform column to clips table
ALTER TABLE clips ADD COLUMN IF NOT EXISTS platform VARCHAR(20);

-- Add comment for the new column
COMMENT ON COLUMN clips.platform IS 'Platform where the video was uploaded from (Instagram, YouTube, TikTok, etc.)';

-- Create index for better performance when filtering by platform
CREATE INDEX IF NOT EXISTS idx_clips_platform ON clips(platform);

-- Update existing records to have a default platform (optional)
-- UPDATE clips SET platform = 'Unknown' WHERE platform IS NULL;





