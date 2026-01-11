-- Company Metrics Table
-- Tracks financial metrics over time (revenue, EPS, margins, etc.)
-- Phase B.2: Financial Metrics Extraction

CREATE TABLE IF NOT EXISTS public.company_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company identification
    company_ticker TEXT NOT NULL, -- e.g., 'AAPL', 'MSFT'
    company_name TEXT, -- Full company name
    
    -- Metric identification
    metric_name TEXT NOT NULL, -- 'revenue', 'eps', 'operating_margin', 'revenue_growth', etc.
    metric_category TEXT CHECK (metric_category IN ('income_statement', 'balance_sheet', 'cash_flow', 'ratio', 'growth', 'guidance')),
    
    -- Metric value
    value DECIMAL(15,2), -- Numeric value
    value_unit TEXT DEFAULT 'USD', -- 'USD', 'percent', 'ratio', etc.
    
    -- Period information
    period TEXT, -- 'Q1 2025', 'Q2 2025', 'FY 2025', etc.
    fiscal_year INTEGER,
    fiscal_quarter TEXT, -- 'Q1', 'Q2', 'Q3', 'Q4' (for quarterly metrics)
    period_end_date DATE, -- End date of reporting period
    
    -- Source information
    source_type TEXT CHECK (source_type IN ('filing', 'earnings_call', 'event', 'manual')),
    source_filing_id UUID REFERENCES public.financial_filings(id) ON DELETE SET NULL,
    source_earnings_call_id UUID REFERENCES public.earnings_calls(id) ON DELETE SET NULL,
    source_event_id UUID REFERENCES public.nucigen_events(id) ON DELETE SET NULL,
    
    -- Integration with Nucigen events
    linked_events UUID[], -- Array of nucigen_events.id that relate to this metric
    
    -- Additional metadata
    metadata JSONB, -- Additional context (e.g., {"segment": "iPhone", "region": "Americas"})
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_company_metrics_ticker ON public.company_metrics(company_ticker);
CREATE INDEX IF NOT EXISTS idx_company_metrics_metric ON public.company_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_company_metrics_period ON public.company_metrics(period_end_date DESC);
CREATE INDEX IF NOT EXISTS idx_company_metrics_ticker_metric ON public.company_metrics(company_ticker, metric_name);
CREATE INDEX IF NOT EXISTS idx_company_metrics_ticker_period ON public.company_metrics(company_ticker, period_end_date DESC);
CREATE INDEX IF NOT EXISTS idx_company_metrics_source_filing ON public.company_metrics(source_filing_id) WHERE source_filing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_metrics_source_event ON public.company_metrics(source_event_id) WHERE source_event_id IS NOT NULL;

-- Unique constraint: one metric per company per period (to avoid duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_metrics_unique ON public.company_metrics(
    company_ticker, 
    metric_name, 
    COALESCE(period_end_date, '1900-01-01'::DATE), 
    COALESCE(fiscal_quarter, '')
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_company_metrics_updated_at
    BEFORE UPDATE ON public.company_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_company_metrics_updated_at();

-- RLS Policies (Row Level Security)
ALTER TABLE public.company_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read company metrics (public data)
CREATE POLICY "Company metrics are readable by authenticated users"
    ON public.company_metrics
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only service role can insert/update metrics (backend only)
CREATE POLICY "Only service role can manage company metrics"
    ON public.company_metrics
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Comment for documentation
COMMENT ON TABLE public.company_metrics IS 'Tracks financial metrics over time (revenue, EPS, margins, etc.) extracted from filings, earnings calls, or events. Used for company comparison and trend analysis.';
COMMENT ON COLUMN public.company_metrics.source_type IS 'Source of the metric: filing (from SEC filing), earnings_call (from transcript), event (from nucigen event extraction), or manual (user-entered)';
