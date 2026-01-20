-- Search Memory Tables
-- Stores user search context (entities, relationships) across sessions
-- Enables intelligent caching and context-aware searches

-- Entities memory table
CREATE TABLE IF NOT EXISTS search_memory_entities (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  mentions INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contexts TEXT[] DEFAULT '{}',
  relevance_score NUMERIC(3, 2) DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, entity_id)
);

-- Relationships memory table
CREATE TABLE IF NOT EXISTS search_memory_relationships (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL,
  strength NUMERIC(3, 2) DEFAULT 0.5,
  occurrences INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence NUMERIC(3, 2) DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_id, target_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_memory_entities_user_id ON search_memory_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_search_memory_entities_last_seen ON search_memory_entities(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_search_memory_entities_type ON search_memory_entities(type);

CREATE INDEX IF NOT EXISTS idx_search_memory_relationships_user_id ON search_memory_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_search_memory_relationships_last_seen ON search_memory_relationships(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_search_memory_relationships_source ON search_memory_relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_search_memory_relationships_target ON search_memory_relationships(target_id);

-- RLS Policies
ALTER TABLE search_memory_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_memory_relationships ENABLE ROW LEVEL SECURITY;

-- Users can only access their own memory
CREATE POLICY "Users can view their own search memory entities"
  ON search_memory_entities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search memory entities"
  ON search_memory_entities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search memory entities"
  ON search_memory_entities
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own search memory relationships"
  ON search_memory_relationships
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search memory relationships"
  ON search_memory_relationships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search memory relationships"
  ON search_memory_relationships
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_search_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_memory_entities_updated_at
  BEFORE UPDATE ON search_memory_entities
  FOR EACH ROW
  EXECUTE FUNCTION update_search_memory_updated_at();

CREATE TRIGGER update_search_memory_relationships_updated_at
  BEFORE UPDATE ON search_memory_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_search_memory_updated_at();
