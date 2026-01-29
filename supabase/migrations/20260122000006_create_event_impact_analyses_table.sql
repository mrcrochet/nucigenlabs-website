-- ============================================
-- Corporate Impact Engine (Event-Level Analysis)
-- Table: event_impact_analyses
-- Stores structured causal analysis per event (output of Corporate Impact Engine prompt)
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_impact_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Classification (from prompt)
  event_type TEXT NOT NULL,
  event_scope TEXT NOT NULL CHECK (event_scope IN ('Local', 'Regional', 'Global')),

  -- Affected sectors with rationale
  affected_sectors JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{ "sector": "Energy", "rationale": "..." }, ...]

  -- Causal chain (ordered steps)
  causal_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- ["Event → First-order effect → ...", ...]

  -- Corporate exposure channels
  exposure_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{ "channel": "Geographic presence", "explanation": "..." }, ...]

  -- Impact assessment
  impact_assessment JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { "direction": "Positive"|"Negative"|"Mixed", "intensity": "Low"|"Medium"|"High"|"Critical", "time_horizon": "Immediate"|"Short-term"|"Medium-term"|"Long-term" }

  -- Confidence
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('High', 'Medium', 'Low')),
  confidence_rationale TEXT,

  -- Computed score 0-100 for sorting/filtering (intensity × confidence)
  impact_score INT DEFAULT NULL CHECK (impact_score IS NULL OR (impact_score >= 0 AND impact_score <= 100)),

  -- Audit
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_impact_analyses_event_id ON public.event_impact_analyses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_impact_analyses_event_type ON public.event_impact_analyses(event_type);
CREATE INDEX IF NOT EXISTS idx_event_impact_analyses_impact_score ON public.event_impact_analyses(impact_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_event_impact_analyses_created_at ON public.event_impact_analyses(created_at DESC);

-- GIN for JSONB filters if needed
CREATE INDEX IF NOT EXISTS idx_event_impact_analyses_affected_sectors ON public.event_impact_analyses USING GIN(affected_sectors);
CREATE INDEX IF NOT EXISTS idx_event_impact_analyses_impact_assessment ON public.event_impact_analyses USING GIN(impact_assessment);

-- RLS
ALTER TABLE public.event_impact_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read event impact analyses"
  ON public.event_impact_analyses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage event impact analyses"
  ON public.event_impact_analyses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.event_impact_analyses IS 'Event-level causal analysis from Corporate Impact Engine (classification, sectors, causal chain, exposure channels, impact assessment)';
COMMENT ON COLUMN public.event_impact_analyses.impact_score IS 'Computed 0-100 score from intensity and confidence for sorting';
