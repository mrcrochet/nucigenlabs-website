-- ============================================
-- PHASE 7: Prédictions Multi-Scénarios
-- ============================================

-- Table pour stocker les prédictions de scénarios
CREATE TABLE IF NOT EXISTS public.scenario_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucigen_event_id UUID NOT NULL REFERENCES public.nucigen_events(id) ON DELETE CASCADE,
  scenario_type TEXT NOT NULL CHECK (scenario_type IN (
    'optimistic',   -- Scénario optimiste
    'realistic',    -- Scénario réaliste (baseline)
    'pessimistic'   -- Scénario pessimiste
  )),
  predicted_outcome TEXT NOT NULL, -- Description du scénario prédit
  probability NUMERIC NOT NULL CHECK (probability >= 0 AND probability <= 1), -- Probabilité du scénario (0-1)
  time_horizon TEXT NOT NULL CHECK (time_horizon IN (
    '1week',      -- 1 semaine
    '1month',     -- 1 mois
    '3months',    -- 3 mois
    '6months',    -- 6 mois
    '1year'       -- 1 an
  )),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT NOT NULL, -- Raisonnement derrière la prédiction
  key_indicators TEXT[], -- Indicateurs clés à surveiller
  risk_factors TEXT[], -- Facteurs de risque
  opportunities TEXT[], -- Opportunités potentielles
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte: les probabilités des 3 scénarios doivent sommer à ~1.0
  -- (vérifié au niveau application, pas DB)
  
  -- Contrainte: pas de doublons (même scénario pour même événement)
  CONSTRAINT unique_scenario UNIQUE (nucigen_event_id, scenario_type, time_horizon)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_scenario_predictions_event ON public.scenario_predictions(nucigen_event_id);
CREATE INDEX IF NOT EXISTS idx_scenario_predictions_type ON public.scenario_predictions(scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenario_predictions_horizon ON public.scenario_predictions(time_horizon);
CREATE INDEX IF NOT EXISTS idx_scenario_predictions_probability ON public.scenario_predictions(probability DESC);
CREATE INDEX IF NOT EXISTS idx_scenario_predictions_created ON public.scenario_predictions(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_scenario_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scenario_predictions_updated_at ON public.scenario_predictions;
CREATE TRIGGER trigger_update_scenario_predictions_updated_at
  BEFORE UPDATE ON public.scenario_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_scenario_predictions_updated_at();

-- RLS Policies
ALTER TABLE public.scenario_predictions ENABLE ROW LEVEL SECURITY;

-- Les prédictions sont visibles par tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Scenario predictions are viewable by authenticated users" ON public.scenario_predictions;
CREATE POLICY "Scenario predictions are viewable by authenticated users"
  ON public.scenario_predictions
  FOR SELECT
  TO authenticated
  USING (true);

-- Fonction pour obtenir les scénarios d'un événement
CREATE OR REPLACE FUNCTION get_scenario_predictions(
  event_id UUID,
  horizon_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  scenario_type TEXT,
  predicted_outcome TEXT,
  probability NUMERIC,
  time_horizon TEXT,
  confidence NUMERIC,
  reasoning TEXT,
  key_indicators TEXT[],
  risk_factors TEXT[],
  opportunities TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.scenario_type,
    sp.predicted_outcome,
    sp.probability,
    sp.time_horizon,
    sp.confidence,
    sp.reasoning,
    sp.key_indicators,
    sp.risk_factors,
    sp.opportunities
  FROM public.scenario_predictions sp
  WHERE sp.nucigen_event_id = event_id
    AND (horizon_filter IS NULL OR sp.time_horizon = horizon_filter)
  ORDER BY 
    sp.time_horizon,
    CASE sp.scenario_type
      WHEN 'optimistic' THEN 1
      WHEN 'realistic' THEN 2
      WHEN 'pessimistic' THEN 3
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION get_scenario_predictions TO authenticated;

