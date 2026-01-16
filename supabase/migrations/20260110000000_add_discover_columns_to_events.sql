-- ============================================
-- DISCOVER: Add Discover columns to events table
-- ============================================
-- 
-- Strategy: events remains the single source of truth
-- Discover = projection/state of events with discover_* columns
--
-- This migration adds:
-- - discover_score: Internal relevance score (0-100)
-- - discover_tier: Priority tier (critical, strategic, background)
-- - discover_consensus: Consensus level (high, fragmented, disputed)
-- - discover_why_it_matters: Perplexity-generated impact statement (batch enriched)
-- - discover_enriched_at: Timestamp of Perplexity enrichment
-- - discover_thumbnail: Image URL for Discover display
-- - discover_sources: JSONB array of sources for Discover
-- - discover_type: Type for Discover (article, event, trend)
-- - discover_category: Category for Discover filtering
-- - discover_tags: Tags for Discover filtering
-- - discover_concepts: EventRegistry concepts (JSONB)
-- - discover_location: Location data (JSONB)
-- - discover_sentiment: Sentiment (positive, negative, neutral)
-- - discover_article_count: Number of articles (for events)
--
-- Indexes for Discover queries:
-- - idx_events_discover_score: For sorting by relevance
-- - idx_events_discover_tier: For filtering by tier
-- - idx_events_discover_category: For category filtering
-- - idx_events_discover_enrichment: For batch enrichment queries

-- Add Discover columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS discover_score INTEGER,
  ADD COLUMN IF NOT EXISTS discover_tier TEXT CHECK (discover_tier IN ('critical', 'strategic', 'background')),
  ADD COLUMN IF NOT EXISTS discover_consensus TEXT CHECK (discover_consensus IN ('high', 'fragmented', 'disputed')),
  ADD COLUMN IF NOT EXISTS discover_why_it_matters TEXT,
  ADD COLUMN IF NOT EXISTS discover_enriched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discover_thumbnail TEXT,
  ADD COLUMN IF NOT EXISTS discover_sources JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS discover_type TEXT CHECK (discover_type IN ('article', 'event', 'trend')),
  ADD COLUMN IF NOT EXISTS discover_category TEXT,
  ADD COLUMN IF NOT EXISTS discover_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS discover_concepts JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS discover_location JSONB,
  ADD COLUMN IF NOT EXISTS discover_sentiment TEXT CHECK (discover_sentiment IN ('positive', 'negative', 'neutral')),
  ADD COLUMN IF NOT EXISTS discover_article_count INTEGER DEFAULT 0;

-- Indexes for Discover queries
CREATE INDEX IF NOT EXISTS idx_events_discover_score 
  ON public.events(discover_score DESC) 
  WHERE discover_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_discover_tier 
  ON public.events(discover_tier) 
  WHERE discover_tier IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_discover_category 
  ON public.events(discover_category) 
  WHERE discover_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_discover_enrichment 
  ON public.events(discover_score DESC, discover_enriched_at) 
  WHERE discover_why_it_matters IS NULL AND discover_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_discover_type 
  ON public.events(discover_type) 
  WHERE discover_type IS NOT NULL;

-- GIN index for tags (array search)
CREATE INDEX IF NOT EXISTS idx_events_discover_tags 
  ON public.events USING GIN(discover_tags) 
  WHERE discover_tags IS NOT NULL AND array_length(discover_tags, 1) > 0;

-- GIN index for concepts (JSONB search)
CREATE INDEX IF NOT EXISTS idx_events_discover_concepts 
  ON public.events USING GIN(discover_concepts) 
  WHERE discover_concepts IS NOT NULL AND jsonb_array_length(discover_concepts) > 0;

-- Comment for documentation
COMMENT ON COLUMN public.events.discover_score IS 'Internal relevance score (0-100) calculated without LLM';
COMMENT ON COLUMN public.events.discover_tier IS 'Priority tier: critical (score > 90), strategic (70-90), background (< 70)';
COMMENT ON COLUMN public.events.discover_consensus IS 'Consensus level based on source count: high (40+), fragmented (10-40), disputed (< 10)';
COMMENT ON COLUMN public.events.discover_why_it_matters IS 'Perplexity-generated impact statement (batch enriched, not in user request flow)';
COMMENT ON COLUMN public.events.discover_enriched_at IS 'Timestamp when Perplexity enrichment was applied';
