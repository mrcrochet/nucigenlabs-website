-- API Usage Metrics Table
-- Tracks API calls, costs, performance, and cache efficiency
-- Enables monitoring and optimization of API ecosystem

CREATE TABLE IF NOT EXISTS public.api_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    time_window_start TIMESTAMPTZ NOT NULL, -- Start of aggregation window (hourly/daily)
    time_window_end TIMESTAMPTZ NOT NULL,   -- End of aggregation window
    
    -- API identification
    api_type TEXT NOT NULL CHECK (api_type IN ('openai', 'tavily', 'firecrawl', 'perplexity', 'eventregistry')),
    api_endpoint TEXT NOT NULL, -- e.g., 'extractEvent', 'search', 'scrapeOfficial'
    feature_name TEXT, -- e.g., 'event-extraction', 'personalized-feed', 'fact-checking'
    
    -- Call statistics
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    cached_calls INTEGER DEFAULT 0, -- Calls served from cache
    
    -- Performance metrics
    avg_latency_ms NUMERIC(10, 2), -- Average response time in milliseconds
    min_latency_ms NUMERIC(10, 2),
    max_latency_ms NUMERIC(10, 2),
    p50_latency_ms NUMERIC(10, 2), -- 50th percentile
    p95_latency_ms NUMERIC(10, 2), -- 95th percentile
    p99_latency_ms NUMERIC(10, 2), -- 99th percentile
    
    -- Cache efficiency
    cache_hit_rate NUMERIC(5, 4) DEFAULT 0, -- Percentage (0-1)
    cache_miss_rate NUMERIC(5, 4) DEFAULT 0,
    
    -- Cost estimation (in USD)
    estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
    
    -- Token usage (for OpenAI)
    total_tokens_used INTEGER,
    total_input_tokens INTEGER,
    total_output_tokens INTEGER,
    
    -- Rate limiting
    rate_limit_hits INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    
    -- Error tracking
    error_types JSONB, -- Map of error types to counts
    error_rate NUMERIC(5, 4) DEFAULT 0, -- Percentage (0-1)
    
    -- Metadata
    metadata JSONB -- Additional context-specific data
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_api_metrics_time_window ON public.api_usage_metrics(time_window_start, time_window_end);
CREATE INDEX IF NOT EXISTS idx_api_metrics_type_endpoint ON public.api_usage_metrics(api_type, api_endpoint);
CREATE INDEX IF NOT EXISTS idx_api_metrics_recorded_at ON public.api_usage_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_feature ON public.api_usage_metrics(feature_name) WHERE feature_name IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_api_metrics_summary ON public.api_usage_metrics(api_type, recorded_at DESC, feature_name);

-- Table for individual API call logs (optional, for detailed debugging)
CREATE TABLE IF NOT EXISTS public.api_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- API identification
    api_type TEXT NOT NULL CHECK (api_type IN ('openai', 'tavily', 'firecrawl', 'perplexity', 'eventregistry')),
    api_endpoint TEXT NOT NULL,
    feature_name TEXT,
    
    -- Request details
    request_hash TEXT, -- Hash of request for deduplication
    cache_key TEXT, -- Cache key used (if any)
    was_cached BOOLEAN DEFAULT false,
    
    -- Response details
    success BOOLEAN NOT NULL,
    latency_ms INTEGER, -- Response time in milliseconds
    error_message TEXT,
    error_code TEXT,
    
    -- Cost and usage
    estimated_cost_usd NUMERIC(10, 6),
    tokens_used INTEGER,
    input_tokens INTEGER,
    output_tokens INTEGER,
    
    -- Rate limiting
    was_rate_limited BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB
);

-- Indexes for call logs
CREATE INDEX IF NOT EXISTS idx_api_call_logs_started_at ON public.api_call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_type_endpoint ON public.api_call_logs(api_type, api_endpoint);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_cache_key ON public.api_call_logs(cache_key) WHERE cache_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_call_logs_success ON public.api_call_logs(success, started_at DESC);

-- Function to aggregate metrics from call logs (run periodically)
CREATE OR REPLACE FUNCTION aggregate_api_metrics(
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.api_usage_metrics (
        time_window_start,
        time_window_end,
        api_type,
        api_endpoint,
        feature_name,
        total_calls,
        successful_calls,
        failed_calls,
        cached_calls,
        avg_latency_ms,
        min_latency_ms,
        max_latency_ms,
        cache_hit_rate,
        cache_miss_rate,
        estimated_cost_usd,
        total_tokens_used,
        total_input_tokens,
        total_output_tokens,
        rate_limit_hits,
        retry_count,
        error_rate
    )
    SELECT
        start_time,
        end_time,
        api_type,
        api_endpoint,
        feature_name,
        COUNT(*)::INTEGER as total_calls,
        COUNT(*) FILTER (WHERE success = true)::INTEGER as successful_calls,
        COUNT(*) FILTER (WHERE success = false)::INTEGER as failed_calls,
        COUNT(*) FILTER (WHERE was_cached = true)::INTEGER as cached_calls,
        AVG(latency_ms)::NUMERIC(10, 2) as avg_latency_ms,
        MIN(latency_ms)::NUMERIC(10, 2) as min_latency_ms,
        MAX(latency_ms)::NUMERIC(10, 2) as max_latency_ms,
        (COUNT(*) FILTER (WHERE was_cached = true)::NUMERIC / NULLIF(COUNT(*), 0))::NUMERIC(5, 4) as cache_hit_rate,
        (COUNT(*) FILTER (WHERE was_cached = false)::NUMERIC / NULLIF(COUNT(*), 0))::NUMERIC(5, 4) as cache_miss_rate,
        COALESCE(SUM(estimated_cost_usd), 0)::NUMERIC(10, 6) as estimated_cost_usd,
        SUM(tokens_used)::INTEGER as total_tokens_used,
        SUM(input_tokens)::INTEGER as total_input_tokens,
        SUM(output_tokens)::INTEGER as total_output_tokens,
        COUNT(*) FILTER (WHERE was_rate_limited = true)::INTEGER as rate_limit_hits,
        SUM(retry_count)::INTEGER as retry_count,
        (COUNT(*) FILTER (WHERE success = false)::NUMERIC / NULLIF(COUNT(*), 0))::NUMERIC(5, 4) as error_rate
    FROM public.api_call_logs
    WHERE started_at >= start_time AND started_at < end_time
    GROUP BY api_type, api_endpoint, feature_name;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old call logs (keep only last N days)
CREATE OR REPLACE FUNCTION cleanup_old_api_call_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.api_call_logs
    WHERE started_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.api_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_call_logs ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access metrics" ON public.api_usage_metrics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access logs" ON public.api_call_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can read metrics
CREATE POLICY "Authenticated users can read metrics" ON public.api_usage_metrics
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON TABLE public.api_usage_metrics IS 'Aggregated metrics for API usage, performance, and costs';
COMMENT ON TABLE public.api_call_logs IS 'Detailed logs of individual API calls for debugging and analysis';
COMMENT ON FUNCTION aggregate_api_metrics IS 'Aggregates metrics from call logs for a given time window';
