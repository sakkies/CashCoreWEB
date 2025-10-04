-- Add view count columns to clips table for automatic view count updates

-- Add view count column to store the current view count
ALTER TABLE clips 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT NULL;

-- Add last view count update timestamp column
ALTER TABLE clips 
ADD COLUMN IF NOT EXISTS last_view_count_update TIMESTAMP DEFAULT NULL;

-- Add index for better performance on view count queries
CREATE INDEX IF NOT EXISTS idx_clips_view_count_update ON clips(last_view_count_update);

-- Add index for platform-based queries
CREATE INDEX IF NOT EXISTS idx_clips_platform ON clips(platform);


