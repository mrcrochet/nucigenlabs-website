-- Earnings Calls Table
-- Stores earnings call transcripts with extracted summaries and key points
-- Phase A.2: Earnings Calls Support (PRIORITY HIGH)

CREATE TABLE IF NOT EXISTS public.earnings_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company identification
    company_ticker TEXT NOT NULL, -- e.g., 'AAPL', 'MSFT'
    company_name TEXT, -- Full company name
    
    -- Call identification
    quarter TEXT, -- e.g., 'Q1 2025', 'FY 2025'
    call_date DATE NOT NULL,
    fiscal_year INTEGER,
    fiscal_quarter TEXT, -- 'Q1', 'Q2', 'Q3', 'Q4'
    
    -- Transcript metadata
    transcript_url TEXT, -- URL to transcript source (Seeking Alpha, etc.)
    transcript_source TEXT, -- 'seeking_alpha', 'fool', 'manual', etc.
    duration_minutes INTEGER, -- Call duration in minutes (if available)
    
    -- Extracted summary and analysis
    summary TEXT, -- High-level summary of the earnings call
    key_points TEXT[], -- Array of key talking points
    -- Example: ["Revenue beat expectations by 5%", "Guidance raised for Q2", "New product launch announced"]
    
    -- Guidance changes (structured)
    guidance_changes JSONB,
    -- Example:
    -- {
    --   "revenue": {"old_low": 90B, "old_high": 95B, "new_low": 95B, "new_high": 100B, "direction": "raised"},
    --   "eps": {"old": 1.50, "new": 1.65, "direction": "raised"}
    -- }
    
    -- Sentiment analysis
    sentiment_score DECIMAL(3,2), -- -1.00 (very negative) to 1.00 (very positive)
    sentiment_label TEXT CHECK (sentiment_label IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive')),
    
    -- Key metrics mentioned (if any)
    mentioned_metrics JSONB,
    -- Example: {"revenue_growth": 0.15, "margin_expansion": 0.02, "capex_increase": 0.10}
    
    -- Integration with Nucigen events
    linked_events UUID[], -- Array of nucigen_events.id that relate to this earnings call
    
    -- Processing metadata
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
    processing_error TEXT,
    extracted_at TIMESTAMPTZ, -- When transcript was processed
    extraction_model TEXT, -- LLM model used (e.g., 'gpt-4', 'claude-3-opus')
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_earnings_calls_ticker ON public.earnings_calls(company_ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_calls_date ON public.earnings_calls(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_calls_ticker_date ON public.earnings_calls(company_ticker, call_date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_calls_sentiment ON public.earnings_calls(sentiment_score DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_calls_status ON public.earnings_calls(processing_status);

-- Index for GIN on guidance_changes and mentioned_metrics (for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_earnings_calls_guidance ON public.earnings_calls USING GIN(guidance_changes);
CREATE INDEX IF NOT EXISTS idx_earnings_calls_metrics ON public.earnings_calls USING GIN(mentioned_metrics);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_earnings_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_earnings_calls_updated_at
    BEFORE UPDATE ON public.earnings_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_earnings_calls_updated_at();

-- RLS Policies (Row Level Security)
ALTER TABLE public.earnings_calls ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read earnings calls (public data)
CREATE POLICY "Earnings calls are readable by authenticated users"
    ON public.earnings_calls
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only service role can insert/update earnings calls (backend only)
CREATE POLICY "Only service role can manage earnings calls"
    ON public.earnings_calls
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Comment for documentation
COMMENT ON TABLE public.earnings_calls IS 'Stores earnings call transcripts with LLM-extracted summaries, key points, guidance changes, and sentiment analysis. Linked to nucigen_events for causal analysis.';
COMMENT ON COLUMN public.earnings_calls.guidance_changes IS 'JSONB containing structured guidance changes (revenue, EPS, etc.) with old/new values and direction';
COMMENT ON COLUMN public.earnings_calls.sentiment_score IS 'Sentiment score from -1.00 (very negative) to 1.00 (very positive), calculated via LLM analysis';
