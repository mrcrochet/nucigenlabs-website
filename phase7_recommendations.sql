-- ============================================
-- PHASE 7: Recommandations Proactives
-- ============================================

-- Table pour stocker les recommandations
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.nucigen_events(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'monitor',      -- Surveiller cet événement
    'prepare',      -- Se préparer à un impact
    'act',          -- Agir immédiatement
    'investigate',  -- Investiguer plus en profondeur
    'mitigate',     -- Atténuer les risques
    'capitalize'    -- Capitaliser sur une opportunité
  )),
  action TEXT NOT NULL, -- Action concrète à prendre
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  reasoning TEXT NOT NULL, -- Pourquoi cette recommandation
  deadline TIMESTAMP WITH TIME ZONE, -- Quand agir (optionnel)
  urgency_score NUMERIC CHECK (urgency_score >= 0 AND urgency_score <= 1), -- Score d'urgence (0-1)
  impact_potential NUMERIC CHECK (impact_potential >= 0 AND impact_potential <= 1), -- Impact potentiel (0-1)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed', 'dismissed')),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte: pas de doublons (même recommandation pour même user/event)
  CONSTRAINT unique_recommendation UNIQUE (user_id, event_id, recommendation_type)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_event ON public.recommendations(event_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON public.recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON public.recommendations(priority, urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON public.recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_created ON public.recommendations(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_recommendations_updated_at ON public.recommendations;
CREATE TRIGGER trigger_update_recommendations_updated_at
  BEFORE UPDATE ON public.recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_recommendations_updated_at();

-- RLS Policies
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne voient que leurs propres recommandations
DROP POLICY IF EXISTS "Users can view their own recommendations" ON public.recommendations;
CREATE POLICY "Users can view their own recommendations"
  ON public.recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres recommandations
DROP POLICY IF EXISTS "Users can update their own recommendations" ON public.recommendations;
CREATE POLICY "Users can update their own recommendations"
  ON public.recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour obtenir les recommandations d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_recommendations(
  target_user_id UUID,
  status_filter TEXT DEFAULT NULL,
  priority_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  event_summary TEXT,
  event_impact_score NUMERIC,
  recommendation_type TEXT,
  action TEXT,
  priority TEXT,
  reasoning TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  urgency_score NUMERIC,
  impact_potential NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.event_id,
    ne.summary as event_summary,
    ne.impact_score as event_impact_score,
    r.recommendation_type,
    r.action,
    r.priority,
    r.reasoning,
    r.deadline,
    r.urgency_score,
    r.impact_potential,
    r.status,
    r.created_at
  FROM public.recommendations r
  JOIN public.nucigen_events ne ON ne.id = r.event_id
  WHERE r.user_id = target_user_id
    AND (status_filter IS NULL OR r.status = status_filter)
    AND (priority_filter IS NULL OR r.priority = priority_filter)
  ORDER BY 
    CASE r.priority
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
    END,
    r.urgency_score DESC NULLS LAST,
    r.created_at DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;

-- Fonction pour compter les recommandations non lues
CREATE OR REPLACE FUNCTION count_unread_recommendations(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM public.recommendations
  WHERE user_id = target_user_id
    AND status = 'pending';
  
  RETURN count_result;
END;
$$;

GRANT EXECUTE ON FUNCTION count_unread_recommendations TO authenticated;

