-- ============================================
-- Trade Impact Table (UN Comtrade Integration)
-- Stores trade flow impact analysis for events
-- ============================================

CREATE TABLE IF NOT EXISTS public.trade_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Trade Impact Metrics
  trade_impact_score DECIMAL(3,2) NOT NULL CHECK (trade_impact_score >= 0 AND trade_impact_score <= 1),
  impact_type TEXT NOT NULL CHECK (impact_type IN ('Trade Disruption', 'Trade Reallocation', 'Supply Chain Risk', 'Market Opportunity')),
  direction TEXT NOT NULL CHECK (direction IN ('Positive', 'Negative', 'Mixed')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Affected Entities
  affected_sectors TEXT[] DEFAULT '{}',
  affected_regions TEXT[] DEFAULT '{}',
  countries_affected TEXT[] DEFAULT '{}',
  hs_codes TEXT[] DEFAULT '{}',
  
  -- Time Horizon
  time_horizon TEXT NOT NULL CHECK (time_horizon IN ('short', 'medium', 'long')),
  
  -- Trade Evidence (stored as JSONB for flexibility)
  trade_evidence JSONB DEFAULT '[]'::jsonb,
  
  -- Detailed Metrics (stored as JSONB)
  metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one trade impact per event
  UNIQUE(event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trade_impact_event_id ON public.trade_impact(event_id);
CREATE INDEX IF NOT EXISTS idx_trade_impact_score ON public.trade_impact(trade_impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_trade_impact_type ON public.trade_impact(impact_type);
CREATE INDEX IF NOT EXISTS idx_trade_impact_direction ON public.trade_impact(direction);
CREATE INDEX IF NOT EXISTS idx_trade_impact_sectors ON public.trade_impact USING GIN(affected_sectors);
CREATE INDEX IF NOT EXISTS idx_trade_impact_regions ON public.trade_impact USING GIN(affected_regions);

-- RLS Policies
ALTER TABLE public.trade_impact ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read trade impact data
CREATE POLICY "Users can read trade impact data"
  ON public.trade_impact
  FOR SELECT
  USING (true);

-- Policy: Service role can insert/update trade impact data
CREATE POLICY "Service role can manage trade impact data"
  ON public.trade_impact
  FOR ALL
  USING (auth.role() = 'service_role');
