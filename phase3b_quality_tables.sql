-- ============================================
-- PHASE 3B: Quality Improvement System
-- Tables for human validation, feedback, and quality metrics
-- ============================================

-- Table: event_validations (human validation of events)
CREATE TABLE IF NOT EXISTS public.event_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucigen_event_id UUID REFERENCES public.nucigen_events(id) ON DELETE CASCADE NOT NULL,
  
  -- Validation status
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'needs_revision')),
  
  -- Reviewer info
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_email TEXT,
  reviewer_notes TEXT,
  
  -- Quality scores (0-1)
  accuracy_score NUMERIC CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  relevance_score NUMERIC CHECK (relevance_score >= 0 AND relevance_score <= 1),
  completeness_score NUMERIC CHECK (completeness_score >= 0 AND completeness_score <= 1),
  
  -- Issues found
  issues TEXT[], -- Array of issue descriptions
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one validation per event per reviewer
  UNIQUE(nucigen_event_id, reviewer_id)
);

-- Table: causal_chain_validations (human validation of causal chains)
CREATE TABLE IF NOT EXISTS public.causal_chain_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  causal_chain_id UUID REFERENCES public.nucigen_causal_chains(id) ON DELETE CASCADE NOT NULL,
  
  -- Validation status
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'needs_revision')),
  
  -- Reviewer info
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_email TEXT,
  reviewer_notes TEXT,
  
  -- Quality scores (0-1)
  logical_coherence_score NUMERIC CHECK (logical_coherence_score >= 0 AND logical_coherence_score <= 1),
  causality_strength_score NUMERIC CHECK (causality_strength_score >= 0 AND causality_strength_score <= 1),
  time_horizon_accuracy_score NUMERIC CHECK (time_horizon_accuracy_score >= 0 AND time_horizon_accuracy_score <= 1),
  
  -- Issues found
  issues TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(causal_chain_id, reviewer_id)
);

-- Table: prompt_feedback (feedback to improve prompts)
CREATE TABLE IF NOT EXISTS public.prompt_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Which phase/prompt
  phase TEXT NOT NULL CHECK (phase IN ('phase1', 'phase2b')),
  prompt_version TEXT, -- Version identifier for A/B testing
  
  -- Related entities
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  nucigen_event_id UUID REFERENCES public.nucigen_events(id) ON DELETE CASCADE,
  causal_chain_id UUID REFERENCES public.nucigen_causal_chains(id) ON DELETE CASCADE,
  
  -- Feedback
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('missing_field', 'incorrect_field', 'poor_quality', 'hallucination', 'other')),
  feedback_text TEXT NOT NULL,
  
  -- Suggestion for improvement
  suggested_improvement TEXT,
  
  -- Reviewer
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_email TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: quality_metrics (aggregated quality metrics)
CREATE TABLE IF NOT EXISTS public.quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time period
  metric_date DATE NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('daily', 'weekly', 'monthly')),
  
  -- Phase 1 metrics
  phase1_total_events INTEGER DEFAULT 0,
  phase1_approved_count INTEGER DEFAULT 0,
  phase1_rejected_count INTEGER DEFAULT 0,
  phase1_needs_revision_count INTEGER DEFAULT 0,
  phase1_avg_accuracy NUMERIC,
  phase1_avg_relevance NUMERIC,
  phase1_avg_completeness NUMERIC,
  
  -- Phase 2B metrics
  phase2b_total_chains INTEGER DEFAULT 0,
  phase2b_approved_count INTEGER DEFAULT 0,
  phase2b_rejected_count INTEGER DEFAULT 0,
  phase2b_needs_revision_count INTEGER DEFAULT 0,
  phase2b_avg_logical_coherence NUMERIC,
  phase2b_avg_causality_strength NUMERIC,
  phase2b_avg_time_horizon_accuracy NUMERIC,
  
  -- Overall quality score (0-1)
  overall_quality_score NUMERIC CHECK (overall_quality_score >= 0 AND overall_quality_score <= 1),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(metric_date, metric_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_validations_nucigen_event_id ON public.event_validations(nucigen_event_id);
CREATE INDEX IF NOT EXISTS idx_event_validations_status ON public.event_validations(status);
CREATE INDEX IF NOT EXISTS idx_event_validations_reviewer_id ON public.event_validations(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_causal_chain_validations_chain_id ON public.causal_chain_validations(causal_chain_id);
CREATE INDEX IF NOT EXISTS idx_causal_chain_validations_status ON public.causal_chain_validations(status);
CREATE INDEX IF NOT EXISTS idx_causal_chain_validations_reviewer_id ON public.causal_chain_validations(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_prompt_feedback_phase ON public.prompt_feedback(phase);
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_created_at ON public.prompt_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quality_metrics_date ON public.quality_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_type ON public.quality_metrics(metric_type);

-- RLS Policies
ALTER TABLE public.event_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causal_chain_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_metrics ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read all validations
CREATE POLICY "Event validations are viewable by authenticated users"
  ON public.event_validations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event validations are insertable by authenticated users"
  ON public.event_validations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Event validations are updatable by authenticated users"
  ON public.event_validations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Causal chain validations are viewable by authenticated users"
  ON public.causal_chain_validations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Causal chain validations are insertable by authenticated users"
  ON public.causal_chain_validations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Causal chain validations are updatable by authenticated users"
  ON public.causal_chain_validations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Prompt feedback is viewable by authenticated users"
  ON public.prompt_feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Prompt feedback is insertable by authenticated users"
  ON public.prompt_feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Quality metrics are viewable by authenticated users"
  ON public.quality_metrics FOR SELECT
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_event_validations_updated_at
  BEFORE UPDATE ON public.event_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_causal_chain_validations_updated_at
  BEFORE UPDATE ON public.causal_chain_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_metrics_updated_at
  BEFORE UPDATE ON public.quality_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

