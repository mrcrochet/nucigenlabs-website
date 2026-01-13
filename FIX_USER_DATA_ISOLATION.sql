-- ============================================
-- FIX: User Data Isolation
-- Ensure users only see their own personalized events
-- ============================================

-- First, drop all existing versions of the function to avoid ambiguity
-- This removes the old function (without user_id) if it exists
DO $$
BEGIN
  -- Drop old version (8 parameters: search_query, sector_filter, region_filter, event_type_filter, time_horizon_filter, min_impact_score, min_confidence_score, limit_count, offset_count)
  DROP FUNCTION IF EXISTS search_nucigen_events(TEXT, TEXT[], TEXT[], TEXT[], TEXT[], NUMERIC, NUMERIC, INTEGER, INTEGER);
  -- Drop new version if it already exists (9 parameters with user_id)
  DROP FUNCTION IF EXISTS search_nucigen_events(TEXT, TEXT[], TEXT[], TEXT[], TEXT[], NUMERIC, NUMERIC, INTEGER, INTEGER, UUID);
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if function doesn't exist
    NULL;
END $$;

-- 1. Update search_nucigen_events function to filter by user_id
CREATE OR REPLACE FUNCTION search_nucigen_events(
  search_query TEXT DEFAULT '',
  sector_filter TEXT[] DEFAULT NULL,
  region_filter TEXT[] DEFAULT NULL,
  event_type_filter TEXT[] DEFAULT NULL,
  time_horizon_filter TEXT[] DEFAULT NULL,
  min_impact_score NUMERIC DEFAULT NULL,
  min_confidence_score NUMERIC DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  user_id UUID DEFAULT NULL  -- NEW: Add user_id parameter
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
    -- NEW: Filter personalized events by user_id
    -- If event has a source_event_id, check if it's personalized for this user
    AND (
      -- Case 1: Event has no source_event_id (general event, visible to all)
      ne.source_event_id IS NULL
      -- Case 2: Event has source_event_id but source is not personalized (general event)
      OR NOT EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = ne.source_event_id 
        AND e.source LIKE 'tavily:personalized:%'
      )
      -- Case 3: Event is personalized for this specific user
      OR (
        user_id IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.events e 
          WHERE e.id = ne.source_event_id 
          AND e.source = 'tavily:personalized:' || user_id::TEXT
        )
      )
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

-- First, drop all existing versions of the count function to avoid ambiguity
DO $$
BEGIN
  -- Drop old version (7 parameters without user_id)
  DROP FUNCTION IF EXISTS count_nucigen_events_search(TEXT, TEXT[], TEXT[], TEXT[], TEXT[], NUMERIC, NUMERIC);
  -- Drop new version if it already exists (8 parameters with user_id)
  DROP FUNCTION IF EXISTS count_nucigen_events_search(TEXT, TEXT[], TEXT[], TEXT[], TEXT[], NUMERIC, NUMERIC, UUID);
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if function doesn't exist
    NULL;
END $$;

-- 2. Update count_nucigen_events_search function to filter by user_id
CREATE OR REPLACE FUNCTION count_nucigen_events_search(
  search_query TEXT DEFAULT '',
  sector_filter TEXT[] DEFAULT NULL,
  region_filter TEXT[] DEFAULT NULL,
  event_type_filter TEXT[] DEFAULT NULL,
  time_horizon_filter TEXT[] DEFAULT NULL,
  min_impact_score NUMERIC DEFAULT NULL,
  min_confidence_score NUMERIC DEFAULT NULL,
  user_id UUID DEFAULT NULL  -- NEW: Add user_id parameter
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
    )
    -- NEW: Filter personalized events by user_id
    AND (
      -- Case 1: Event has no source_event_id (general event, visible to all)
      ne.source_event_id IS NULL
      -- Case 2: Event has source_event_id but source is not personalized (general event)
      OR NOT EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = ne.source_event_id 
        AND e.source LIKE 'tavily:personalized:%'
      )
      -- Case 3: Event is personalized for this specific user
      OR (
        user_id IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.events e 
          WHERE e.id = ne.source_event_id 
          AND e.source = 'tavily:personalized:' || user_id::TEXT
        )
      )
    );
  
  RETURN result_count;
END;
$$;

-- Grant execute permissions (specify full signature to avoid ambiguity)
GRANT EXECUTE ON FUNCTION search_nucigen_events(
  TEXT, TEXT[], TEXT[], TEXT[], TEXT[], NUMERIC, NUMERIC, INTEGER, INTEGER, UUID
) TO authenticated;
GRANT EXECUTE ON FUNCTION count_nucigen_events_search(
  TEXT, TEXT[], TEXT[], TEXT[], TEXT[], NUMERIC, NUMERIC, UUID
) TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Test query to verify the function works:
-- SELECT * FROM search_nucigen_events(
--   search_query := '',
--   user_id := 'YOUR_USER_UUID_HERE'::UUID,
--   limit_count := 10
-- );
