-- Pressure Signals — Phase 2 persistence layer
-- For v1, pressure data lives in-memory alongside signals.
-- This table is prepared for Phase 2 when signals are persisted.
-- Run ONLY this file in Supabase SQL Editor (not any .ts file).

CREATE TABLE IF NOT EXISTS public.nucigen_pressure_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id TEXT NOT NULL,
  system TEXT NOT NULL CHECK (system IN ('Security','Maritime','Energy','Industrial','Monetary')),
  pressure_vector TEXT NOT NULL,
  impact_order INT NOT NULL CHECK (impact_order BETWEEN 1 AND 3),
  time_horizon_days INT NOT NULL,
  evidence_strength NUMERIC NOT NULL CHECK (evidence_strength BETWEEN 0 AND 1),
  novelty NUMERIC NOT NULL CHECK (novelty BETWEEN 0 AND 1),
  transmission_channels JSONB DEFAULT '[]',
  exposed_entities JSONB DEFAULT '[]',
  uncertainties JSONB DEFAULT '[]',
  citations JSONB DEFAULT '[]',
  probability_estimate NUMERIC NOT NULL,
  magnitude_estimate INT NOT NULL CHECK (magnitude_estimate BETWEEN 0 AND 100),
  confidence_score NUMERIC NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pressure_system ON public.nucigen_pressure_signals(system);
CREATE INDEX IF NOT EXISTS idx_pressure_magnitude ON public.nucigen_pressure_signals(magnitude_estimate DESC);
