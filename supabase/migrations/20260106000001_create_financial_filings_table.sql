-- Financial Filings Table (SEC/EDGAR Integration)
-- Stores extracted data from SEC filings (10-K, 10-Q, 8-K, etc.)
-- Phase A.1: SEC/EDGAR Integration (PRIORITY HIGH)

CREATE TABLE IF NOT EXISTS public.financial_filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company identification
    company_ticker TEXT NOT NULL, -- e.g., 'AAPL', 'MSFT'
    company_name TEXT, -- Full company name
    cik TEXT, -- SEC Central Index Key (optional but useful)
    
    -- Filing identification
    filing_type TEXT NOT NULL CHECK (filing_type IN ('10-K', '10-Q', '8-K', 'DEF 14A', 'S-1', 'OTHER')),
    filing_date DATE NOT NULL,
    period_end_date DATE, -- End of reporting period
    fiscal_year INTEGER, -- Fiscal year
    fiscal_quarter TEXT, -- 'Q1', 'Q2', 'Q3', 'Q4' (for 10-Q)
    
    -- Filing metadata
    filing_url TEXT UNIQUE, -- SEC EDGAR URL
    accession_number TEXT, -- SEC accession number (unique identifier)
    form_type TEXT, -- Full form type from SEC
    
    -- Extracted financial data (JSONB for flexibility)
    extracted_data JSONB, -- Structured financial metrics
    -- Example structure:
    -- {
    --   "revenue": 1234567890.50,
    --   "revenue_growth": 0.15,
    --   "eps": 3.45,
    --   "eps_growth": 0.12,
    --   "operating_margin": 0.25,
    --   "guidance": {
    --     "revenue_low": 1000000000,
    --     "revenue_high": 1200000000
    --   },
    --   "key_highlights": ["Strong iPhone sales", "Services revenue up 20%"]
    -- }
    
    -- Integration with Nucigen events
    linked_events UUID[], -- Array of nucigen_events.id that relate to this filing
    
    -- Processing metadata
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
    processing_error TEXT,
    extracted_at TIMESTAMPTZ, -- When data was extracted
    extraction_model TEXT, -- LLM model used (e.g., 'gpt-4', 'claude-3-opus')
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_financial_filings_ticker ON public.financial_filings(company_ticker);
CREATE INDEX IF NOT EXISTS idx_financial_filings_date ON public.financial_filings(filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_filings_type ON public.financial_filings(filing_type);
CREATE INDEX IF NOT EXISTS idx_financial_filings_ticker_date ON public.financial_filings(company_ticker, filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_filings_accession ON public.financial_filings(accession_number) WHERE accession_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_financial_filings_status ON public.financial_filings(processing_status);

-- Index for GIN on extracted_data (for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_financial_filings_extracted_data ON public.financial_filings USING GIN(extracted_data);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_financial_filings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_financial_filings_updated_at
    BEFORE UPDATE ON public.financial_filings
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_filings_updated_at();

-- RLS Policies (Row Level Security)
ALTER TABLE public.financial_filings ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read financial filings (public data)
CREATE POLICY "Financial filings are readable by authenticated users"
    ON public.financial_filings
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only service role can insert/update filings (backend only)
CREATE POLICY "Only service role can manage financial filings"
    ON public.financial_filings
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Comment for documentation
COMMENT ON TABLE public.financial_filings IS 'Stores SEC EDGAR filings (10-K, 10-Q, 8-K) with extracted financial data. Linked to nucigen_events for causal analysis.';
COMMENT ON COLUMN public.financial_filings.extracted_data IS 'JSONB containing structured financial metrics (revenue, EPS, margins, guidance, etc.) extracted via LLM';
COMMENT ON COLUMN public.financial_filings.linked_events IS 'Array of nucigen_events.id that relate to this filing (e.g., geopolitical events affecting company performance)';
