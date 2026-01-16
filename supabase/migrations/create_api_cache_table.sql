-- API Cache Table
-- Stores cached responses from all APIs (OpenAI, Tavily, Firecrawl)
-- Enables intelligent caching to reduce API calls and costs

CREATE TABLE IF NOT EXISTS public.api_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache key (hash of API type + request parameters)
    cache_key TEXT NOT NULL UNIQUE,
    
    -- API identification
    api_type TEXT NOT NULL CHECK (api_type IN ('openai', 'tavily', 'firecrawl', 'perplexity', 'eventregistry')),
    api_endpoint TEXT NOT NULL, -- e.g., 'extractEvent', 'search', 'scrapeOfficial'
    
    -- Request identification
    request_hash TEXT NOT NULL, -- Hash of request parameters for quick lookup
    
    -- Cached response
    response_data JSONB NOT NULL,
    response_metadata JSONB, -- Additional metadata (model used, tokens, etc.)
    
    -- Cache control
    ttl_seconds INTEGER, -- Time-to-live in seconds (null = permanent)
    expires_at TIMESTAMPTZ, -- Calculated expiration time
    cache_version INTEGER DEFAULT 1, -- For schema versioning
    
    -- Usage tracking
    hit_count INTEGER DEFAULT 0, -- Number of cache hits
    last_hit_at TIMESTAMPTZ, -- Last time cache was accessed
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON public.api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_type_endpoint ON public.api_cache(api_type, api_endpoint);
CREATE INDEX IF NOT EXISTS idx_api_cache_request_hash ON public.api_cache(request_hash);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON public.api_cache(expires_at) WHERE expires_at IS NOT NULL;

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_api_cache_expired ON public.api_cache(expires_at) WHERE expires_at < NOW();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_update_api_cache_updated_at
    BEFORE UPDATE ON public.api_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_api_cache_updated_at();

-- Function to increment hit count
CREATE OR REPLACE FUNCTION increment_api_cache_hit(cache_key_param TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.api_cache
    SET 
        hit_count = hit_count + 1,
        last_hit_at = NOW()
    WHERE cache_key = cache_key_param;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_api_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.api_cache
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (if needed for multi-tenant)
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.api_cache
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read cache (for debugging)
CREATE POLICY "Authenticated users can read cache" ON public.api_cache
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON TABLE public.api_cache IS 'Cache for API responses to reduce redundant calls and costs';
COMMENT ON COLUMN public.api_cache.cache_key IS 'Unique cache key (combination of api_type, endpoint, and request hash)';
COMMENT ON COLUMN public.api_cache.request_hash IS 'Hash of request parameters for quick lookup';
COMMENT ON COLUMN public.api_cache.ttl_seconds IS 'Time-to-live in seconds (null = permanent cache)';
COMMENT ON COLUMN public.api_cache.cache_version IS 'Version number for cache schema evolution';
