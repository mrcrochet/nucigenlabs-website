-- ============================================
-- Migration: Create market_insights table
-- ============================================
-- Stores market intelligence insights generated from geopolitical events
-- Each insight links an event to a company with directional impact prediction

CREATE TABLE IF NOT EXISTS public.market_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Company information
  company_name TEXT NOT NULL,
  company_ticker TEXT, -- e.g., "AAPL", "TSLA"
  company_exchange TEXT, -- e.g., "NASDAQ", "NYSE"
  company_sector TEXT, -- e.g., "Technology", "Energy"
  
  -- Impact prediction
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  probability NUMERIC NOT NULL CHECK (probability >= 0 AND probability <= 1),
  time_horizon TEXT NOT NULL CHECK (time_horizon IN ('short', 'medium', 'long')),
  
  -- Analysis
  thesis TEXT NOT NULL, -- 2-3 sentence causal mechanism explanation
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  
  -- Evidence (stored as JSONB for flexibility)
  supporting_evidence JSONB DEFAULT '[]'::jsonb, -- Array of {type, description, source, url}
  
  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by TEXT DEFAULT 'market_intelligence_service',
  quality_score NUMERIC DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
  
  -- Caching/TTL
  ttl_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one insight per event-company combination (can update if event changes)
  UNIQUE(event_id, company_ticker, company_exchange)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_market_insights_event_id ON public.market_insights(event_id);
CREATE INDEX IF NOT EXISTS idx_market_insights_company_ticker ON public.market_insights(company_ticker);
CREATE INDEX IF NOT EXISTS idx_market_insights_direction ON public.market_insights(direction);
CREATE INDEX IF NOT EXISTS idx_market_insights_sector ON public.market_insights(company_sector);
CREATE INDEX IF NOT EXISTS idx_market_insights_generated_at ON public.market_insights(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_insights_ttl ON public.market_insights(ttl_expires_at) WHERE ttl_expires_at IS NOT NULL;

-- Composite index for common queries (filter by direction + sector)
CREATE INDEX IF NOT EXISTS idx_market_insights_direction_sector ON public.market_insights(direction, company_sector);

-- Enable Row Level Security
ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can read all market insights
CREATE POLICY "Authenticated users can read market insights"
  ON public.market_insights
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Service role can do everything (for generating insights)
CREATE POLICY "Service role full access"
  ON public.market_insights
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_market_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER trigger_update_market_insights_updated_at
  BEFORE UPDATE ON public.market_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_market_insights_updated_at();

-- Add comment
COMMENT ON TABLE public.market_insights IS 'Market intelligence insights linking geopolitical events to company stock impacts';
COMMENT ON COLUMN public.market_insights.supporting_evidence IS 'JSONB array of evidence items: [{type: "news"|"historical_pattern", description, source, url}]';
COMMENT ON COLUMN public.market_insights.time_horizon IS 'short: days-weeks, medium: weeks-months, long: months-years';
