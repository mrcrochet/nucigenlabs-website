-- ============================================
-- PHASE 7: Analyse Comparative Historique
-- ============================================

-- Table pour stocker les comparaisons historiques
CREATE TABLE IF NOT EXISTS public.historical_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_event_id UUID NOT NULL REFERENCES public.nucigen_events(id) ON DELETE CASCADE,
  historical_event_id UUID NOT NULL REFERENCES public.nucigen_events(id) ON DELETE CASCADE,
  similarity_score NUMERIC NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1), -- Score de similarité (0-1)
  similarity_factors TEXT[], -- Facteurs de similarité (ex: ['sector', 'region', 'event_type'])
  comparison_insights TEXT, -- Insights de la comparaison
  outcome_differences TEXT, -- Différences dans les résultats historiques
  lessons_learned TEXT, -- Leçons apprises de l'événement historique
  predictive_value NUMERIC CHECK (predictive_value >= 0 AND predictive_value <= 1), -- Valeur prédictive (0-1)
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte: un événement ne peut pas être comparé à lui-même
  CONSTRAINT no_self_comparison CHECK (current_event_id != historical_event_id),
  
  -- Contrainte: pas de doublons
  CONSTRAINT unique_comparison UNIQUE (current_event_id, historical_event_id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_historical_comparisons_current ON public.historical_comparisons(current_event_id);
CREATE INDEX IF NOT EXISTS idx_historical_comparisons_historical ON public.historical_comparisons(historical_event_id);
CREATE INDEX IF NOT EXISTS idx_historical_comparisons_similarity ON public.historical_comparisons(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_historical_comparisons_created ON public.historical_comparisons(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_historical_comparisons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_historical_comparisons_updated_at ON public.historical_comparisons;
CREATE TRIGGER trigger_update_historical_comparisons_updated_at
  BEFORE UPDATE ON public.historical_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION update_historical_comparisons_updated_at();

-- RLS Policies
ALTER TABLE public.historical_comparisons ENABLE ROW LEVEL SECURITY;

-- Les comparaisons sont visibles par tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Historical comparisons are viewable by authenticated users" ON public.historical_comparisons;
CREATE POLICY "Historical comparisons are viewable by authenticated users"
  ON public.historical_comparisons
  FOR SELECT
  TO authenticated
  USING (true);

-- Fonction pour obtenir les comparaisons historiques d'un événement
CREATE OR REPLACE FUNCTION get_historical_comparisons(event_id UUID, min_similarity NUMERIC DEFAULT 0.6)
RETURNS TABLE (
  id UUID,
  historical_event_id UUID,
  historical_event_summary TEXT,
  historical_event_created_at TIMESTAMP WITH TIME ZONE,
  similarity_score NUMERIC,
  similarity_factors TEXT[],
  comparison_insights TEXT,
  outcome_differences TEXT,
  lessons_learned TEXT,
  predictive_value NUMERIC,
  confidence NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hc.id,
    hc.historical_event_id,
    ne.summary as historical_event_summary,
    ne.created_at as historical_event_created_at,
    hc.similarity_score,
    hc.similarity_factors,
    hc.comparison_insights,
    hc.outcome_differences,
    hc.lessons_learned,
    hc.predictive_value,
    hc.confidence
  FROM public.historical_comparisons hc
  JOIN public.nucigen_events ne ON ne.id = hc.historical_event_id
  WHERE hc.current_event_id = event_id
    AND hc.similarity_score >= min_similarity
  ORDER BY hc.similarity_score DESC, hc.predictive_value DESC NULLS LAST
  LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION get_historical_comparisons TO authenticated;

