-- ============================================
-- Corporate Impact Feature
-- Table: market_signals (market signals based on geopolitical/regulatory events)
-- ============================================

CREATE TABLE IF NOT EXISTS public.market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Signal Type
  type TEXT NOT NULL CHECK (type IN ('opportunity', 'risk')),
  
  -- Company Information
  company_name TEXT NOT NULL,
  company_ticker TEXT,
  company_sector TEXT,
  company_market_cap TEXT,
  company_current_price TEXT,
  company_exchange TEXT,
  
  -- Prediction
  prediction_direction TEXT NOT NULL CHECK (prediction_direction IN ('up', 'down')),
  prediction_magnitude TEXT NOT NULL, -- e.g., "45-65%"
  prediction_timeframe TEXT NOT NULL, -- e.g., "3-6 months"
  prediction_confidence TEXT NOT NULL CHECK (prediction_confidence IN ('high', 'medium-high', 'medium', 'medium-low', 'low')),
  prediction_target_price TEXT,
  
  -- Catalyst Event Link
  catalyst_event_title TEXT NOT NULL,
  catalyst_event_tier TEXT,
  
  -- Reasoning (stored as JSONB for flexibility)
  reasoning_summary TEXT NOT NULL,
  reasoning_key_factors JSONB DEFAULT '[]'::jsonb,
  reasoning_risks JSONB DEFAULT '[]'::jsonb,
  
  -- Market Data
  market_data JSONB DEFAULT '{}'::jsonb, -- volume_change, institutional_interest, etc.
  
  -- Sources
  sources JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT DEFAULT 'corporate_impact_worker',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_market_signals_type ON public.market_signals(type);
CREATE INDEX IF NOT EXISTS idx_market_signals_event_id ON public.market_signals(event_id);
CREATE INDEX IF NOT EXISTS idx_market_signals_is_active ON public.market_signals(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_market_signals_generated_at ON public.market_signals(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_signals_company_ticker ON public.market_signals(company_ticker);
CREATE INDEX IF NOT EXISTS idx_market_signals_sector ON public.market_signals(company_sector);

-- RLS Policies (if needed)
ALTER TABLE public.market_signals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read active signals
CREATE POLICY "Allow authenticated users to read active market signals"
  ON public.market_signals
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Allow service role to manage all signals
CREATE POLICY "Allow service role to manage market signals"
  ON public.market_signals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
