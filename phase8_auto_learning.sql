-- =====================================================
-- PHASE 8: Auto-Learning & Amélioration Continue
-- =====================================================
-- 
-- Objectif: Système qui apprend de ses erreurs et s'améliore automatiquement
-- 
-- Tables:
-- 1. model_feedback: Retours utilisateurs sur les prédictions/extractions
-- 2. prompt_versions: Versioning des prompts LLM
-- 3. prompt_performance: Métriques de performance par version
-- =====================================================

-- =====================================================
-- 1. TABLE: model_feedback
-- =====================================================
-- Stocke les retours utilisateurs sur les extractions/prédictions
CREATE TABLE IF NOT EXISTS model_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  event_id UUID REFERENCES nucigen_events(id) ON DELETE CASCADE,
  causal_chain_id UUID REFERENCES nucigen_causal_chains(id) ON DELETE SET NULL,
  scenario_id UUID REFERENCES scenario_predictions(id) ON DELETE SET NULL,
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Type de feedback
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('correction', 'improvement', 'validation', 'rejection')),
  
  -- Contenu du feedback
  component_type TEXT NOT NULL CHECK (component_type IN ('event_extraction', 'causal_chain', 'scenario', 'recommendation', 'relationship', 'historical_comparison')),
  
  -- Données originales vs corrigées
  original_content JSONB, -- Contenu original (extraction, prédiction, etc.)
  corrected_content JSONB, -- Contenu corrigé par l'utilisateur
  reasoning TEXT, -- Explication du feedback
  
  -- Métadonnées
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')), -- Gravité de l'erreur
  impact_score NUMERIC(3, 2) CHECK (impact_score >= 0 AND impact_score <= 1), -- Impact sur la qualité
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'applied', 'rejected')),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour model_feedback
CREATE INDEX IF NOT EXISTS idx_model_feedback_event_id ON model_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_model_feedback_user_id ON model_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_model_feedback_component_type ON model_feedback(component_type);
CREATE INDEX IF NOT EXISTS idx_model_feedback_status ON model_feedback(status);
CREATE INDEX IF NOT EXISTS idx_model_feedback_created_at ON model_feedback(created_at DESC);

-- =====================================================
-- 2. TABLE: prompt_versions
-- =====================================================
-- Versioning des prompts LLM pour chaque composant
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  component_type TEXT NOT NULL CHECK (component_type IN ('event_extraction', 'causal_chain', 'scenario', 'recommendation', 'relationship', 'historical_comparison')),
  version_number INTEGER NOT NULL, -- Numéro de version (1, 2, 3, ...)
  
  -- Contenu du prompt
  prompt_template TEXT NOT NULL, -- Template du prompt avec placeholders
  system_message TEXT, -- Message système pour OpenAI
  model_config JSONB, -- Configuration (temperature, max_tokens, etc.)
  
  -- Métadonnées
  description TEXT, -- Description des changements
  improvement_reason TEXT, -- Raison de l'amélioration (basé sur quel feedback)
  based_on_feedback_ids UUID[], -- IDs des feedbacks qui ont motivé cette version
  
  -- Performance
  is_active BOOLEAN DEFAULT false, -- Version active actuellement
  performance_score NUMERIC(5, 2), -- Score de performance (0-100)
  test_results JSONB, -- Résultats des tests (accuracy, precision, recall, etc.)
  
  -- Validation
  validated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour prompt_versions
CREATE INDEX IF NOT EXISTS idx_prompt_versions_component_type ON prompt_versions(component_type);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_is_active ON prompt_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_version_number ON prompt_versions(component_type, version_number DESC);

-- Contrainte unique partielle: une seule version active par composant
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_versions_one_active_per_component 
  ON prompt_versions(component_type) 
  WHERE is_active = true;

-- =====================================================
-- 3. TABLE: prompt_performance
-- =====================================================
-- Métriques de performance par version de prompt
CREATE TABLE IF NOT EXISTS prompt_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence
  prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL,
  
  -- Métriques
  total_uses INTEGER DEFAULT 0, -- Nombre d'utilisations
  positive_feedback_count INTEGER DEFAULT 0, -- Nombre de validations positives
  negative_feedback_count INTEGER DEFAULT 0, -- Nombre de corrections/rejections
  average_confidence NUMERIC(5, 2), -- Confiance moyenne des extractions
  average_impact_score NUMERIC(5, 2), -- Score d'impact moyen
  
  -- Calculs
  accuracy_score NUMERIC(5, 2), -- Précision (positive / total)
  quality_score NUMERIC(5, 2), -- Score de qualité global
  
  -- Période
  period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_end TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour prompt_performance
CREATE INDEX IF NOT EXISTS idx_prompt_performance_prompt_version_id ON prompt_performance(prompt_version_id);
CREATE INDEX IF NOT EXISTS idx_prompt_performance_component_type ON prompt_performance(component_type);
CREATE INDEX IF NOT EXISTS idx_prompt_performance_period_start ON prompt_performance(period_start DESC);

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Trigger pour updated_at sur model_feedback
CREATE OR REPLACE FUNCTION update_model_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_model_feedback_updated_at ON model_feedback;
CREATE TRIGGER trigger_update_model_feedback_updated_at
  BEFORE UPDATE ON model_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_model_feedback_updated_at();

-- Trigger pour updated_at sur prompt_versions
CREATE OR REPLACE FUNCTION update_prompt_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prompt_versions_updated_at ON prompt_versions;
CREATE TRIGGER trigger_update_prompt_versions_updated_at
  BEFORE UPDATE ON prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_versions_updated_at();

-- Trigger pour updated_at sur prompt_performance
CREATE OR REPLACE FUNCTION update_prompt_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prompt_performance_updated_at ON prompt_performance;
CREATE TRIGGER trigger_update_prompt_performance_updated_at
  BEFORE UPDATE ON prompt_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_performance_updated_at();

-- =====================================================
-- 5. FUNCTIONS SQL
-- =====================================================

-- Fonction pour obtenir le prompt actif pour un composant
CREATE OR REPLACE FUNCTION get_active_prompt(component_type_param TEXT)
RETURNS TABLE (
  id UUID,
  version_number INTEGER,
  prompt_template TEXT,
  system_message TEXT,
  model_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id,
    pv.version_number,
    pv.prompt_template,
    pv.system_message,
    pv.model_config
  FROM prompt_versions pv
  WHERE pv.component_type = component_type_param
    AND pv.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les feedbacks non traités
CREATE OR REPLACE FUNCTION get_pending_feedback(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  component_type TEXT,
  feedback_type TEXT,
  original_content JSONB,
  corrected_content JSONB,
  reasoning TEXT,
  severity TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mf.id,
    mf.event_id,
    mf.component_type,
    mf.feedback_type,
    mf.original_content,
    mf.corrected_content,
    mf.reasoning,
    mf.severity,
    mf.created_at
  FROM model_feedback mf
  WHERE mf.status = 'pending'
  ORDER BY 
    CASE mf.severity
      WHEN 'critical' THEN 4
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 1
      ELSE 0
    END DESC,
    mf.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le score de performance d'une version
CREATE OR REPLACE FUNCTION calculate_prompt_performance(prompt_version_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_uses INTEGER;
  positive_count INTEGER;
  negative_count INTEGER;
  accuracy NUMERIC;
BEGIN
  -- Compter les utilisations
  SELECT COUNT(*) INTO total_uses
  FROM prompt_performance
  WHERE prompt_version_id = prompt_version_id_param;
  
  -- Compter les feedbacks positifs/négatifs
  SELECT 
    COUNT(*) FILTER (WHERE feedback_type = 'validation'),
    COUNT(*) FILTER (WHERE feedback_type IN ('correction', 'rejection'))
  INTO positive_count, negative_count
  FROM model_feedback mf
  JOIN prompt_versions pv ON pv.id = prompt_version_id_param
  WHERE mf.component_type = pv.component_type
    AND mf.created_at >= pv.created_at;
  
  -- Calculer l'accuracy
  IF total_uses > 0 THEN
    accuracy := (positive_count::NUMERIC / total_uses::NUMERIC) * 100;
  ELSE
    accuracy := 0;
  END IF;
  
  RETURN accuracy;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- model_feedback: Users can view their own feedback, admins can view all
ALTER TABLE model_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own feedback" ON model_feedback;
CREATE POLICY "Users can view their own feedback" ON model_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create feedback" ON model_feedback;
CREATE POLICY "Users can create feedback" ON model_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own feedback" ON model_feedback;
CREATE POLICY "Users can update their own feedback" ON model_feedback
  FOR UPDATE
  USING (auth.uid() = user_id);

-- prompt_versions: Authenticated users can view active prompts
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active prompts" ON prompt_versions;
CREATE POLICY "Authenticated users can view active prompts" ON prompt_versions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- prompt_performance: Authenticated users can view performance metrics
ALTER TABLE prompt_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view performance metrics" ON prompt_performance;
CREATE POLICY "Authenticated users can view performance metrics" ON prompt_performance
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. INITIAL DATA: Insérer les prompts initiaux
-- =====================================================

-- Prompt initial pour event_extraction
INSERT INTO prompt_versions (component_type, version_number, prompt_template, system_message, model_config, description, is_active)
VALUES (
  'event_extraction',
  1,
  'You are a geopolitical and economic intelligence analyst. Your task is to extract structured information from a news article.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no code blocks, no explanations
2. All scores must be floats between 0 and 1
3. Use null (not "null" string) for unknown information
4. Be factual: no opinions, no "could", no marketing language
5. Summary must be max 2 sentences, factual only
6. why_it_matters must link event to economic/strategic impact (1-2 sentences)
7. actors must be an array (can be empty [])
8. If information is unknown, use null

JSON Schema (return ONLY this structure):
{
  "event_type": "Geopolitical | Industrial | SupplyChain | Regulatory | Security | Market",
  "event_subtype": "string|null",
  "summary": "max 2 sentences, factual, no hype",
  "country": "string|null",
  "region": "string|null",
  "sector": "string|null",
  "actors": ["string"],
  "why_it_matters": "1-2 sentences linking event to economic/strategic impact",
  "first_order_effect": "string|null",
  "second_order_effect": "string|null",
  "impact_score": 0.0,
  "confidence": 0.0
}

Article to analyze:
Title: {title}
Description: {description}
Content: {content}
URL: {url}
Published: {published_at}

Return ONLY the JSON object, nothing else.',
  'You are a precise data extraction system. Return ONLY valid JSON, no other text.',
  '{"model": "gpt-4o-mini", "temperature": 0.1, "response_format": {"type": "json_object"}}'::jsonb,
  'Initial prompt for event extraction',
  true
) ON CONFLICT DO NOTHING;

-- Prompt initial pour causal_chain
INSERT INTO prompt_versions (component_type, version_number, prompt_template, system_message, model_config, description, is_active)
VALUES (
  'causal_chain',
  1,
  'You are a geopolitical and economic intelligence analyst. Your task is to extract a deterministic causal chain from a structured event.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no code blocks, no explanations
2. Be FACTUAL and DETERMINISTIC - no "could", "might", "possibly", "may"
3. Use present or future tense for effects (they WILL happen, not might)
4. If information is uncertain → use null
5. confidence must be a float between 0 and 1
6. affected_sectors and affected_regions must be arrays (can be empty [])
7. time_horizon must be exactly one of: "hours", "days", "weeks"
8. NO financial predictions, NO price forecasts, NO numerical estimates
9. Focus on structural, operational, and strategic impacts

JSON Schema (return ONLY this structure):
{
  "cause": "string (the event trigger, factual description)",
  "first_order_effect": "string (direct, immediate consequence)",
  "second_order_effect": "string|null (indirect consequence, or null if uncertain)",
  "affected_sectors": ["string"],
  "affected_regions": ["string"],
  "time_horizon": "hours|days|weeks",
  "confidence": 0.0
}

Event to analyze:
Event Type: {event_type}
Summary: {summary}
Country: {country}
Region: {region}
Sector: {sector}
Actors: {actors}
Why it matters: {why_it_matters}
First order effect: {first_order_effect}
Second order effect: {second_order_effect}

Return ONLY the JSON object, nothing else.',
  'You are a precise causal analysis system. Return ONLY valid JSON, no other text. Be deterministic and factual.',
  '{"model": "gpt-4o-mini", "temperature": 0.1, "response_format": {"type": "json_object"}}'::jsonb,
  'Initial prompt for causal chain extraction',
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- ✅ Migration complète
-- =====================================================

