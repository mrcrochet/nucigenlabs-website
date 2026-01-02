-- ============================================
-- PIPELINE DE DONNÉES - TABLES SUPABASE
-- ============================================

-- Table: events (événements bruts collectés)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'newsapi', 'scraper', 'manual', etc.
  source_id TEXT, -- ID dans la source originale (URL, etc.)
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- Contenu complet
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Métadonnées
  url TEXT,
  author TEXT,
  language TEXT DEFAULT 'en',
  
  -- Classification initiale (peut être améliorée par ML)
  raw_category TEXT, -- Catégorie de la source
  raw_tags TEXT[], -- Tags de la source
  
  -- Statut de traitement
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
  processing_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_events_published_at ON public.events(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_source ON public.events(source);
CREATE INDEX IF NOT EXISTS idx_events_source_id ON public.events(source, source_id);

-- Table: processed_events (événements traités et enrichis)
CREATE TABLE IF NOT EXISTS public.processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Classification
  level TEXT NOT NULL CHECK (level IN ('Geopolitical', 'Industrial', 'Supply Chain', 'Market', 'Regulatory')),
  sectors TEXT[] NOT NULL, -- ['Technology', 'Energy', 'Finance', etc.]
  regions TEXT[] NOT NULL, -- ['US', 'EU', 'China', etc.]
  
  -- Entités nommées
  entities JSONB, -- {organizations: [], locations: [], people: [], products: []}
  
  -- Sentiment
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_score NUMERIC, -- -1 to 1
  
  -- Métadonnées de traitement
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_version TEXT, -- Version du modèle utilisé
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_processed_events_event_id ON public.processed_events(event_id);
CREATE INDEX IF NOT EXISTS idx_processed_events_level ON public.processed_events(level);
CREATE INDEX IF NOT EXISTS idx_processed_events_sectors ON public.processed_events USING GIN(sectors);
CREATE INDEX IF NOT EXISTS idx_processed_events_regions ON public.processed_events USING GIN(regions);
CREATE INDEX IF NOT EXISTS idx_processed_events_processed_at ON public.processed_events(processed_at DESC);

-- Table: causal_chains (chaînes causales)
CREATE TABLE IF NOT EXISTS public.causal_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.processed_events(id) ON DELETE CASCADE NOT NULL,
  
  -- Impacts directs
  direct_impacts JSONB NOT NULL, -- Array of Impact objects
  
  -- Impacts de second ordre
  second_order_impacts JSONB,
  
  -- Impacts de troisième ordre
  third_order_impacts JSONB,
  
  -- Métadonnées
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_version TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_causal_chains_event_id ON public.causal_chains(event_id);
CREATE INDEX IF NOT EXISTS idx_causal_chains_generated_at ON public.causal_chains(generated_at DESC);

-- Table: predictions (prédictions de marché)
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.processed_events(id) ON DELETE CASCADE NOT NULL,
  causal_chain_id UUID REFERENCES public.causal_chains(id),
  
  asset TEXT NOT NULL, -- 'Crude Oil (WTI)', 'Semiconductor ETF', etc.
  asset_type TEXT, -- 'commodity', 'equity', 'currency', 'index'
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down', 'neutral')),
  magnitude NUMERIC, -- Pourcentage estimé
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  timeframe TEXT NOT NULL, -- '12-24h', '24-48h', '48-72h', etc.
  reasoning TEXT NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired', 'invalidated')),
  actual_outcome TEXT, -- Rempli après vérification
  accuracy_score NUMERIC, -- Calculé après vérification
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_predictions_event_id ON public.predictions(event_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON public.predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_asset ON public.predictions(asset);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_expires_at ON public.predictions(expires_at) WHERE expires_at IS NOT NULL;

-- Table: user_recommendations (recommandations personnalisées)
CREATE TABLE IF NOT EXISTS public.user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.processed_events(id) ON DELETE CASCADE NOT NULL,
  prediction_id UUID REFERENCES public.predictions(id),
  
  -- Scoring
  relevance_score NUMERIC NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
  reasons TEXT[] NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'dismissed', 'saved')),
  viewed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- Priorité
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(user_id, event_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON public.user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_score ON public.user_recommendations(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_status ON public.user_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_priority ON public.user_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_created_at ON public.user_recommendations(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Events: Lecture publique, écriture service role seulement
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Events can be inserted by service role" ON public.events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Processed events: Lecture publique
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Processed events are viewable by everyone" ON public.processed_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Causal chains: Lecture publique
ALTER TABLE public.causal_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Causal chains are viewable by everyone" ON public.causal_chains
  FOR SELECT
  TO authenticated
  USING (true);

-- Predictions: Lecture publique
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions are viewable by everyone" ON public.predictions
  FOR SELECT
  TO authenticated
  USING (true);

-- User recommendations: Lecture/écriture par utilisateur
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations" ON public.user_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations" ON public.user_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour générer les recommandations pour un utilisateur
CREATE OR REPLACE FUNCTION public.generate_user_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  recommendation_id UUID,
  event_id UUID,
  title TEXT,
  level TEXT,
  relevance_score NUMERIC,
  reasons TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_profile AS (
    SELECT sector, professional_role, intended_use, exposure
    FROM public.users
    WHERE id = p_user_id
  ),
  scored_events AS (
    SELECT 
      pe.id as event_id,
      pe.level,
      e.title,
      -- Calcul du score de pertinence (simplifié)
      CASE 
        WHEN pe.sectors @> ARRAY[up.sector] THEN 40
        ELSE 0
      END +
      CASE 
        WHEN up.professional_role = 'analyst' AND pe.level IN ('Geopolitical', 'Industrial', 'Regulatory') THEN 30
        WHEN up.professional_role = 'trader' AND pe.level IN ('Market', 'Supply Chain') THEN 30
        WHEN up.professional_role = 'portfolio_manager' AND pe.level IN ('Market', 'Geopolitical', 'Industrial') THEN 30
        WHEN up.professional_role = 'researcher' AND pe.level IN ('Geopolitical', 'Regulatory', 'Industrial') THEN 30
        ELSE 0
      END +
      CASE 
        WHEN up.exposure = 'institutional' AND pe.level = 'Critical' THEN 10
        ELSE 0
      END as relevance_score,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN pe.sectors @> ARRAY[up.sector] THEN 'Relevant to your sector: ' || up.sector END,
        CASE 
          WHEN up.professional_role = 'analyst' AND pe.level IN ('Geopolitical', 'Industrial', 'Regulatory') 
          THEN 'Matches your analytical role' 
        END,
        CASE 
          WHEN up.exposure = 'institutional' AND pe.level = 'Critical' 
          THEN 'Critical event for institutional exposure' 
        END
      ], NULL)::TEXT[] as reasons
    FROM public.processed_events pe
    CROSS JOIN user_profile up
    JOIN public.events e ON e.id = pe.event_id
    WHERE pe.processed_at > NOW() - INTERVAL '7 days' -- Derniers 7 jours
    AND NOT EXISTS (
      SELECT 1 FROM public.user_recommendations ur
      WHERE ur.user_id = p_user_id AND ur.event_id = pe.id
    )
  )
  SELECT 
    gen_random_uuid() as recommendation_id,
    se.event_id,
    se.title,
    se.level,
    se.relevance_score,
    se.reasons
  FROM scored_events se
  WHERE se.relevance_score > 30 -- Seuil minimum
  ORDER BY se.relevance_score DESC
  LIMIT p_limit;
END;
$$;

-- Fonction pour marquer une recommandation comme vue
CREATE OR REPLACE FUNCTION public.mark_recommendation_viewed(
  p_recommendation_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_recommendations
  SET status = 'viewed',
      viewed_at = NOW()
  WHERE id = p_recommendation_id
  AND user_id = auth.uid();
END;
$$;

-- Fonction pour marquer une recommandation comme dismissée
CREATE OR REPLACE FUNCTION public.mark_recommendation_dismissed(
  p_recommendation_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_recommendations
  SET status = 'dismissed',
      dismissed_at = NOW()
  WHERE id = p_recommendation_id
  AND user_id = auth.uid();
END;
$$;

