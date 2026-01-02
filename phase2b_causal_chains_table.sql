-- ============================================
-- PHASE 2B: Causal Chains Extraction
-- Table: nucigen_causal_chains
-- ============================================

-- Table principale: nucigen_causal_chains
CREATE TABLE IF NOT EXISTS public.nucigen_causal_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucigen_event_id UUID REFERENCES public.nucigen_events(id) ON DELETE CASCADE NOT NULL,

  -- Chaîne causale
  cause TEXT NOT NULL,
  first_order_effect TEXT NOT NULL,
  second_order_effect TEXT,

  -- Impact géographique et sectoriel
  affected_sectors TEXT[] DEFAULT '{}',
  affected_regions TEXT[] DEFAULT '{}',

  -- Horizon temporel
  time_horizon TEXT CHECK (time_horizon IN ('hours', 'days', 'weeks')),

  -- Confiance
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),

  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_causal_chains_event_id ON public.nucigen_causal_chains(nucigen_event_id);
CREATE INDEX IF NOT EXISTS idx_causal_chains_created_at ON public.nucigen_causal_chains(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_causal_chains_time_horizon ON public.nucigen_causal_chains(time_horizon);
CREATE INDEX IF NOT EXISTS idx_causal_chains_affected_sectors ON public.nucigen_causal_chains USING GIN(affected_sectors);
CREATE INDEX IF NOT EXISTS idx_causal_chains_affected_regions ON public.nucigen_causal_chains USING GIN(affected_regions);

-- Contrainte unique : 1 chaîne causale par événement
CREATE UNIQUE INDEX IF NOT EXISTS idx_causal_chains_unique_event ON public.nucigen_causal_chains(nucigen_event_id);

-- RLS: Lecture publique, écriture service role seulement
ALTER TABLE public.nucigen_causal_chains ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Causal chains are viewable by authenticated users" ON public.nucigen_causal_chains;
DROP POLICY IF EXISTS "Causal chains can be inserted by service role" ON public.nucigen_causal_chains;
DROP POLICY IF EXISTS "Causal chains can be updated by service role" ON public.nucigen_causal_chains;

-- Create policies
CREATE POLICY "Causal chains are viewable by authenticated users" ON public.nucigen_causal_chains
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Causal chains can be inserted by service role" ON public.nucigen_causal_chains
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Causal chains can be updated by service role" ON public.nucigen_causal_chains
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

