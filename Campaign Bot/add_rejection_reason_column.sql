-- Add rejection_reason column to clips table
ALTER TABLE clips ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment for the new column
COMMENT ON COLUMN clips.rejection_reason IS 'Reason for rejection if the clip was rejected';
