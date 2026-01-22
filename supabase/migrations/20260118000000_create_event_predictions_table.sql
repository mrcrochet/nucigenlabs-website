-- Event Predictions Table
-- Stores generated scenario outlooks for events with TTL and caching

CREATE TABLE IF NOT EXISTS public.event_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event reference
    event_id TEXT NOT NULL, -- Canonical event ID
    
    -- Prediction data (strict JSON format)
    prediction_json JSONB NOT NULL,
    
    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    ttl_expires_at TIMESTAMPTZ NOT NULL, -- When this prediction expires (6h/12h based on tier)
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('fast', 'standard', 'deep')),
    
    -- Cache control
    cache_key TEXT, -- Hash for cache lookup
    cache_version INTEGER DEFAULT 1,
    
    -- Quality metrics
    evidence_count INTEGER DEFAULT 0, -- Number of supporting evidence items
    historical_patterns_count INTEGER DEFAULT 0, -- Number of historical patterns found
    confidence_score NUMERIC(3, 2), -- Overall confidence (0-1)
    
    -- Budget tracking
    api_calls_count INTEGER DEFAULT 0, -- Number of API calls made
    estimated_cost NUMERIC(10, 6) DEFAULT 0, -- Estimated cost in USD
    
    -- Indexes
    CONSTRAINT event_predictions_event_id_key UNIQUE (event_id),
    CONSTRAINT event_predictions_cache_key_key UNIQUE (cache_key)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_predictions_event_id ON public.event_predictions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_predictions_ttl_expires_at ON public.event_predictions(ttl_expires_at);
CREATE INDEX IF NOT EXISTS idx_event_predictions_cache_key ON public.event_predictions(cache_key);
CREATE INDEX IF NOT EXISTS idx_event_predictions_generated_at ON public.event_predictions(generated_at DESC);

-- RLS Policies (if needed)
ALTER TABLE public.event_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own predictions (if user_id is added later)
-- For now, allow all authenticated users to read
CREATE POLICY "Users can read event predictions"
    ON public.event_predictions
    FOR SELECT
    USING (true);

-- Policy: Service can insert/update predictions
CREATE POLICY "Service can manage event predictions"
    ON public.event_predictions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to automatically clean expired predictions
CREATE OR REPLACE FUNCTION clean_expired_predictions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.event_predictions
    WHERE ttl_expires_at < NOW();
END;
$$;

-- Optional: Create a scheduled job to clean expired predictions (requires pg_cron extension)
-- SELECT cron.schedule('clean-expired-predictions', '0 * * * *', 'SELECT clean_expired_predictions()');

COMMENT ON TABLE public.event_predictions IS 'Stores generated scenario outlooks for events with TTL and caching';
COMMENT ON COLUMN public.event_predictions.prediction_json IS 'Strict JSON format with outlooks, evidence, and probabilities';
COMMENT ON COLUMN public.event_predictions.ttl_expires_at IS 'When this prediction expires and should be regenerated';
