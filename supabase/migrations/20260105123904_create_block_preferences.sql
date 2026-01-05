-- Migration: Create user_block_preferences table for modular blocks system
-- This table stores user preferences for block layouts on different pages

CREATE TABLE IF NOT EXISTS user_block_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('event_detail', 'dashboard', 'intelligence', 'events', 'alerts')),
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one preference record per user per page type
  UNIQUE(user_id, page_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_block_preferences_user_id ON user_block_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_block_preferences_page_type ON user_block_preferences(page_type);
CREATE INDEX IF NOT EXISTS idx_user_block_preferences_user_page ON user_block_preferences(user_id, page_type);

-- Enable Row Level Security
ALTER TABLE user_block_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own block preferences
CREATE POLICY "Users can view their own block preferences"
  ON user_block_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own block preferences
CREATE POLICY "Users can insert their own block preferences"
  ON user_block_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own block preferences
CREATE POLICY "Users can update their own block preferences"
  ON user_block_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own block preferences
CREATE POLICY "Users can delete their own block preferences"
  ON user_block_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_block_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_user_block_preferences_updated_at
  BEFORE UPDATE ON user_block_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_block_preferences_updated_at();

-- Add comment
COMMENT ON TABLE user_block_preferences IS 'Stores user preferences for modular block layouts on different pages';
COMMENT ON COLUMN user_block_preferences.blocks IS 'JSONB array of block configurations with id, type, order, visible, and config fields';

