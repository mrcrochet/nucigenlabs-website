-- ML Features Table (Feature Store)
-- Pre-computed features for fast model training and prediction
-- Reduces computation time by storing features once and reusing

CREATE TABLE IF NOT EXISTS public.ml_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity identification
    entity_type TEXT NOT NULL CHECK (entity_type IN ('event', 'user', 'event_user_pair', 'query')),
    entity_id TEXT NOT NULL, -- ID of the entity (event_id, user_id, or composite)
    
    -- Feature extraction metadata
    feature_set_version INTEGER DEFAULT 1, -- Version of feature extraction logic
    extracted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Event features (if entity_type = 'event')
    event_type TEXT,
    event_sector TEXT,
    event_region TEXT,
    event_impact_score NUMERIC(3, 2),
    event_confidence NUMERIC(3, 2),
    event_actors_count INTEGER,
    event_has_causal_chain BOOLEAN,
    event_days_since_publication INTEGER,
    event_source_quality_score NUMERIC(3, 2), -- Quality of source (Tavily score, etc.)
    
    -- User features (if entity_type = 'user')
    user_sector TEXT,
    user_professional_role TEXT,
    user_preferred_sectors_count INTEGER,
    user_preferred_regions_count INTEGER,
    user_account_age_days INTEGER,
    user_engagement_score NUMERIC(3, 2), -- Based on clicks, reads, shares
    
    -- Event-User pair features (if entity_type = 'event_user_pair')
    sector_match BOOLEAN,
    region_match BOOLEAN,
    event_type_match BOOLEAN,
    impact_score_above_threshold BOOLEAN,
    confidence_above_threshold BOOLEAN,
    historical_interaction_count INTEGER, -- Past interactions with similar events
    historical_click_rate NUMERIC(3, 2), -- User's historical click rate for similar events
    
    -- Query features (if entity_type = 'query')
    query_length INTEGER,
    query_keyword_count INTEGER,
    query_has_sector BOOLEAN,
    query_has_region BOOLEAN,
    query_has_temporal_indicator BOOLEAN,
    
    -- Computed features (can be calculated from above)
    relevance_score_raw NUMERIC(5, 4), -- Raw relevance score (before ML)
    quality_score NUMERIC(5, 4), -- Quality score of entity
    
    -- Vector features (for embeddings)
    embedding_vector REAL[], -- Optional: vector embeddings (e.g., from OpenAI embeddings)
    embedding_model TEXT, -- Model used for embedding (e.g., 'text-embedding-3-small')
    
    -- All features as JSONB (for flexibility)
    all_features JSONB, -- Complete feature set as JSONB for easy access
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ml_features_entity ON public.ml_features(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ml_features_extracted_at ON public.ml_features(extracted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_features_version ON public.ml_features(feature_set_version);

-- Composite index for event-user pairs
CREATE INDEX IF NOT EXISTS idx_ml_features_event_user 
    ON public.ml_features(entity_type, entity_id) 
    WHERE entity_type = 'event_user_pair';

-- Index for embedding similarity search (if using pgvector extension)
-- CREATE INDEX IF NOT EXISTS idx_ml_features_embedding 
--     ON public.ml_features USING ivfflat (embedding_vector vector_cosine_ops)
--     WITH (lists = 100);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_ml_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ml_features_updated_at
    BEFORE UPDATE ON public.ml_features
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_features_updated_at();

-- Function to get features for an entity
CREATE OR REPLACE FUNCTION get_ml_features(
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_feature_set_version INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    all_features JSONB,
    extracted_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.all_features,
        f.extracted_at
    FROM public.ml_features f
    WHERE f.entity_type = p_entity_type
    AND f.entity_id = p_entity_id
    AND (p_feature_set_version IS NULL OR f.feature_set_version = p_feature_set_version)
    ORDER BY f.extracted_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.ml_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.ml_features
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read features" ON public.ml_features
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON TABLE public.ml_features IS 'Feature store for pre-computed ML features';
COMMENT ON COLUMN public.ml_features.all_features IS 'Complete feature set as JSONB for flexible access';
COMMENT ON COLUMN public.ml_features.embedding_vector IS 'Vector embeddings for similarity search';
