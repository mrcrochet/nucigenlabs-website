-- ============================================
-- Trade Impact Data Table
-- Stores UN Comtrade-based trade impact analysis
-- ============================================

CREATE TABLE IF NOT EXISTS public.trade_impact_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Trade Impact Metrics
  trade_impact_score DECIMAL(3,2) NOT NULL CHECK (trade_impact_score >= 0 AND trade_impact_score <= 1),
  impact_type TEXT NOT NULL CHECK (impact_type IN ('Trade Disruption', 'Trade Reallocation', 'Supply Chain Risk', 'Trade Opportunity')),
  direction TEXT NOT NULL CHECK (direction IN ('Positive', 'Negative', 'Mixed')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  time_horizon TEXT NOT NULL CHECK (time_horizon IN ('short', 'medium', 'long')),
  
  -- Affected Entities
  affected_sectors TEXT[] DEFAULT '{}',
  affected_regions TEXT[] DEFAULT '{}',
  countries_affected TEXT[] DEFAULT '{}',
  hs_codes TEXT[] DEFAULT '{}',
  
  -- Trade Evidence (stored as JSONB for flexibility)
  trade_evidence JSONB DEFAULT '[]'::jsonb,
  
  -- LLM Explanation (explains, doesn't discover)
  explanation TEXT,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trade_impact_data_event_id ON public.trade_impact_data(event_id);
CREATE INDEX IF NOT EXISTS idx_trade_impact_data_impact_type ON public.trade_impact_data(impact_type);
CREATE INDEX IF NOT EXISTS idx_trade_impact_data_score ON public.trade_impact_data(trade_impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_trade_impact_data_last_updated ON public.trade_impact_data(last_updated DESC);

-- RLS Policies (if needed)
ALTER TABLE public.trade_impact_data ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to authenticated users
CREATE POLICY "trade_impact_data_read" ON public.trade_impact_data
  FOR SELECT
  USING (true);

-- Policy: Allow insert/update only for service role
-- (Service role bypasses RLS, so this is mainly for documentation)

COMMENT ON TABLE public.trade_impact_data IS 'Stores UN Comtrade-based trade impact analysis for validating corporate impact signals';
COMMENT ON COLUMN public.trade_impact_data.trade_impact_score IS 'Calculated score (0-1) based on export drops, dependencies, concentration, etc.';
COMMENT ON COLUMN public.trade_impact_data.trade_evidence IS 'Array of trade deltas with metrics, values, and periods (from UN Comtrade)';
COMMENT ON COLUMN public.trade_impact_data.explanation IS 'LLM-generated explanation (LLM explains, does not discover or calculate)';
