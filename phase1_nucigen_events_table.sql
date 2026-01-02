-- ============================================
-- PHASE 1: Event Extraction MVP
-- Table: nucigen_events (structured events)
-- ============================================

-- Vérifier si la table events existe, sinon la créer
-- Note: Cette table peut déjà exister, donc on utilise IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  url TEXT,
  author TEXT,
  language TEXT DEFAULT 'en',
  raw_category TEXT,
  raw_tags TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
  processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table principale: nucigen_events
CREATE TABLE IF NOT EXISTS public.nucigen_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,

  -- Classification
  event_type TEXT NOT NULL CHECK (event_type IN ('Geopolitical', 'Industrial', 'SupplyChain', 'Regulatory', 'Security', 'Market')),
  event_subtype TEXT,

  -- Contenu structuré
  summary TEXT NOT NULL,
  country TEXT,
  region TEXT,
  sector TEXT,
  actors TEXT[] DEFAULT '{}',

  -- Analyse causale (Phase 1: first et second order seulement)
  why_it_matters TEXT,
  first_order_effect TEXT,
  second_order_effect TEXT,

  -- Scores
  impact_score NUMERIC CHECK (impact_score >= 0 AND impact_score <= 1),
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),

  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_nucigen_events_source_event_id ON public.nucigen_events(source_event_id);
CREATE INDEX IF NOT EXISTS idx_nucigen_events_created_at ON public.nucigen_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nucigen_events_event_type ON public.nucigen_events(event_type);
CREATE INDEX IF NOT EXISTS idx_nucigen_events_sector ON public.nucigen_events(sector) WHERE sector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nucigen_events_country ON public.nucigen_events(country) WHERE country IS NOT NULL;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_nucigen_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_nucigen_events_updated_at_trigger ON public.nucigen_events;
CREATE TRIGGER update_nucigen_events_updated_at_trigger
  BEFORE UPDATE ON public.nucigen_events
  FOR EACH ROW
  EXECUTE FUNCTION update_nucigen_events_updated_at();

-- RLS: Lecture publique, écriture service role seulement
ALTER TABLE public.nucigen_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Nucigen events are viewable by authenticated users" ON public.nucigen_events;
DROP POLICY IF EXISTS "Nucigen events can be inserted by service role" ON public.nucigen_events;
DROP POLICY IF EXISTS "Nucigen events can be updated by service role" ON public.nucigen_events;

-- Create policies
CREATE POLICY "Nucigen events are viewable by authenticated users" ON public.nucigen_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Nucigen events can be inserted by service role" ON public.nucigen_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Nucigen events can be updated by service role" ON public.nucigen_events
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

