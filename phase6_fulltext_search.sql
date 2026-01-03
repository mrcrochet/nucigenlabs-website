-- ============================================
-- PHASE 6: Full-Text Search with Supabase
-- PostgreSQL Full-Text Search indexes and functions
-- ============================================

-- ============================================
-- 1. CREATE FULL-TEXT SEARCH INDEXES
-- ============================================

-- Index for nucigen_events (main search target)
-- Searchable fields: summary, why_it_matters, sector, region, country, actors

-- Create text search vector column for nucigen_events
ALTER TABLE public.nucigen_events 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION update_nucigen_events_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.why_it_matters, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.sector, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.region, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.actors, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS trigger_update_nucigen_events_search_vector ON public.nucigen_events;
CREATE TRIGGER trigger_update_nucigen_events_search_vector
  BEFORE INSERT OR UPDATE ON public.nucigen_events
  FOR EACH ROW
  EXECUTE FUNCTION update_nucigen_events_search_vector();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_nucigen_events_search_vector 
ON public.nucigen_events 
USING GIN(search_vector);

-- Update existing rows to populate search_vector
UPDATE public.nucigen_events 
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(summary, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(why_it_matters, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(sector, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(region, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(country, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(actors, ' '), '')), 'C')
WHERE search_vector IS NULL;

-- ============================================
-- 2. CREATE SEARCH FUNCTION
-- ============================================

-- Function to search nucigen_events with full-text search
CREATE OR REPLACE FUNCTION search_nucigen_events(
  search_query TEXT DEFAULT '',
  sector_filter TEXT[] DEFAULT NULL,
  region_filter TEXT[] DEFAULT NULL,
  event_type_filter TEXT[] DEFAULT NULL,
  time_horizon_filter TEXT[] DEFAULT NULL,
  min_impact_score NUMERIC DEFAULT NULL,
  min_confidence_score NUMERIC DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  event_subtype TEXT,
  summary TEXT,
  country TEXT,
  region TEXT,
  sector TEXT,
  actors TEXT[],
  why_it_matters TEXT,
  first_order_effect TEXT,
  second_order_effect TEXT,
  impact_score NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  relevance_score REAL,
  has_causal_chain BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ne.id,
    ne.event_type,
    ne.event_subtype,
    ne.summary,
    ne.country,
    ne.region,
    ne.sector,
    ne.actors,
    ne.why_it_matters,
    ne.first_order_effect,
    ne.second_order_effect,
    ne.impact_score,
    ne.confidence,
    ne.created_at,
    -- Calculate relevance score from full-text search
    CASE 
      WHEN search_query IS NOT NULL AND search_query != '' THEN
        ts_rank(ne.search_vector, plainto_tsquery('english', search_query))
      ELSE 1.0
    END::REAL AS relevance_score,
    -- Check if event has causal chain
    EXISTS(
      SELECT 1 FROM public.nucigen_causal_chains ncc 
      WHERE ncc.nucigen_event_id = ne.id
    ) AS has_causal_chain
  FROM public.nucigen_events ne
  WHERE
    -- Full-text search (if query provided)
    (search_query IS NULL OR search_query = '' OR ne.search_vector @@ plainto_tsquery('english', search_query))
    -- Sector filter
    AND (sector_filter IS NULL OR ne.sector = ANY(sector_filter))
    -- Region filter
    AND (region_filter IS NULL OR ne.region = ANY(region_filter))
    -- Event type filter
    AND (event_type_filter IS NULL OR ne.event_type = ANY(event_type_filter))
    -- Impact score filter
    AND (min_impact_score IS NULL OR ne.impact_score >= min_impact_score)
    -- Confidence filter
    AND (min_confidence_score IS NULL OR ne.confidence >= min_confidence_score)
    -- Only events with causal chains (for Events page)
    AND EXISTS(
      SELECT 1 FROM public.nucigen_causal_chains ncc 
      WHERE ncc.nucigen_event_id = ne.id
    )
  ORDER BY
    -- Sort by relevance if search query provided, else by created_at
    CASE 
      WHEN search_query IS NOT NULL AND search_query != '' THEN
        ts_rank(ne.search_vector, plainto_tsquery('english', search_query))
      ELSE 0
    END DESC,
    ne.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_nucigen_events TO authenticated;

-- ============================================
-- 3. CREATE FUNCTION FOR CAUSAL CHAIN SEARCH
-- ============================================

-- Function to search within causal chains
CREATE OR REPLACE FUNCTION search_causal_chains(
  search_query TEXT DEFAULT '',
  affected_sectors_filter TEXT[] DEFAULT NULL,
  affected_regions_filter TEXT[] DEFAULT NULL,
  time_horizon_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  nucigen_event_id UUID,
  cause TEXT,
  first_order_effect TEXT,
  second_order_effect TEXT,
  affected_sectors TEXT[],
  affected_regions TEXT[],
  time_horizon TEXT,
  confidence NUMERIC,
  relevance_score REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ncc.nucigen_event_id,
    ncc.cause,
    ncc.first_order_effect,
    ncc.second_order_effect,
    ncc.affected_sectors,
    ncc.affected_regions,
    ncc.time_horizon,
    ncc.confidence,
    -- Calculate relevance (simple text matching for now)
    CASE 
      WHEN search_query IS NOT NULL AND search_query != '' THEN
        CASE
          WHEN LOWER(ncc.cause) LIKE '%' || LOWER(search_query) || '%' THEN 0.8
          WHEN LOWER(ncc.first_order_effect) LIKE '%' || LOWER(search_query) || '%' THEN 0.6
          WHEN LOWER(COALESCE(ncc.second_order_effect, '')) LIKE '%' || LOWER(search_query) || '%' THEN 0.4
          ELSE 0.2
        END
      ELSE 1.0
    END::REAL AS relevance_score
  FROM public.nucigen_causal_chains ncc
  WHERE
    -- Text search in causal chain fields
    (search_query IS NULL OR search_query = '' OR
     LOWER(ncc.cause) LIKE '%' || LOWER(search_query) || '%' OR
     LOWER(ncc.first_order_effect) LIKE '%' || LOWER(search_query) || '%' OR
     LOWER(COALESCE(ncc.second_order_effect, '')) LIKE '%' || LOWER(search_query) || '%')
    -- Affected sectors filter
    AND (affected_sectors_filter IS NULL OR ncc.affected_sectors && affected_sectors_filter)
    -- Affected regions filter
    AND (affected_regions_filter IS NULL OR ncc.affected_regions && affected_regions_filter)
    -- Time horizon filter
    AND (time_horizon_filter IS NULL OR ncc.time_horizon = ANY(time_horizon_filter))
  ORDER BY relevance_score DESC, ncc.confidence DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_causal_chains TO authenticated;

-- ============================================
-- 4. CREATE INDEXES FOR FILTERING
-- ============================================

-- Indexes for common filters (already exist, but ensuring they're optimal)
CREATE INDEX IF NOT EXISTS idx_nucigen_events_sector ON public.nucigen_events(sector);
CREATE INDEX IF NOT EXISTS idx_nucigen_events_region ON public.nucigen_events(region);
CREATE INDEX IF NOT EXISTS idx_nucigen_events_event_type ON public.nucigen_events(event_type);
CREATE INDEX IF NOT EXISTS idx_nucigen_events_impact_score ON public.nucigen_events(impact_score);
CREATE INDEX IF NOT EXISTS idx_nucigen_events_confidence ON public.nucigen_events(confidence);
CREATE INDEX IF NOT EXISTS idx_nucigen_events_created_at ON public.nucigen_events(created_at DESC);

-- Index for causal chains filters
CREATE INDEX IF NOT EXISTS idx_causal_chains_affected_sectors ON public.nucigen_causal_chains USING GIN(affected_sectors);
CREATE INDEX IF NOT EXISTS idx_causal_chains_affected_regions ON public.nucigen_causal_chains USING GIN(affected_regions);
CREATE INDEX IF NOT EXISTS idx_causal_chains_time_horizon ON public.nucigen_causal_chains(time_horizon);

-- ============================================
-- 5. CREATE FUNCTION FOR COUNT (for pagination)
-- ============================================

-- Function to count search results (for pagination)
CREATE OR REPLACE FUNCTION count_nucigen_events_search(
  search_query TEXT DEFAULT '',
  sector_filter TEXT[] DEFAULT NULL,
  region_filter TEXT[] DEFAULT NULL,
  event_type_filter TEXT[] DEFAULT NULL,
  time_horizon_filter TEXT[] DEFAULT NULL,
  min_impact_score NUMERIC DEFAULT NULL,
  min_confidence_score NUMERIC DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO result_count
  FROM public.nucigen_events ne
  WHERE
    -- Full-text search
    (search_query IS NULL OR search_query = '' OR ne.search_vector @@ plainto_tsquery('english', search_query))
    -- Filters
    AND (sector_filter IS NULL OR ne.sector = ANY(sector_filter))
    AND (region_filter IS NULL OR ne.region = ANY(region_filter))
    AND (event_type_filter IS NULL OR ne.event_type = ANY(event_type_filter))
    AND (min_impact_score IS NULL OR ne.impact_score >= min_impact_score)
    AND (min_confidence_score IS NULL OR ne.confidence >= min_confidence_score)
    -- Only events with causal chains
    AND EXISTS(
      SELECT 1 FROM public.nucigen_causal_chains ncc 
      WHERE ncc.nucigen_event_id = ne.id
    );
  
  RETURN result_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION count_nucigen_events_search TO authenticated;

-- ============================================
-- NOTES
-- ============================================

-- Weight priorities:
-- A = summary (highest priority)
-- B = why_it_matters (high priority)
-- C = sector, region, country, actors (lower priority)

-- The search function uses PostgreSQL's full-text search which:
-- - Handles stemming (e.g., "running" matches "run")
-- - Ignores stop words (the, a, an, etc.)
-- - Ranks results by relevance
-- - Is case-insensitive

-- Usage example:
-- SELECT * FROM search_nucigen_events(
--   search_query := 'trade sanctions',
--   sector_filter := ARRAY['Technology', 'Energy'],
--   region_filter := ARRAY['US', 'EU'],
--   limit_count := 20,
--   offset_count := 0
-- );

