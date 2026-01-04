-- ============================================
-- PHASE 7: Knowledge Graph & Relations
-- ============================================

-- Table pour stocker les relations entre événements
CREATE TABLE IF NOT EXISTS public.event_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id UUID NOT NULL REFERENCES public.nucigen_events(id) ON DELETE CASCADE,
  target_event_id UUID NOT NULL REFERENCES public.nucigen_events(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'causes',           -- Event A cause Event B
    'precedes',         -- Event A précède Event B (temporel)
    'related_to',       -- Event A est lié à Event B (générique)
    'contradicts',      -- Event A contredit Event B
    'amplifies',        -- Event A amplifie Event B
    'mitigates',        -- Event A atténue Event B
    'triggers',         -- Event A déclenche Event B
    'follows_from'      -- Event B découle de Event A
  )),
  strength NUMERIC NOT NULL CHECK (strength >= 0 AND strength <= 1), -- Force de la relation (0-1)
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1), -- Confiance dans la relation
  evidence TEXT, -- Preuve/explication de la relation
  reasoning TEXT, -- Raisonnement derrière la relation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte: un événement ne peut pas être lié à lui-même
  CONSTRAINT no_self_relationship CHECK (source_event_id != target_event_id),
  
  -- Contrainte: pas de doublons (même relation entre deux événements)
  CONSTRAINT unique_relationship UNIQUE (source_event_id, target_event_id, relationship_type)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_event_relationships_source ON public.event_relationships(source_event_id);
CREATE INDEX IF NOT EXISTS idx_event_relationships_target ON public.event_relationships(target_event_id);
CREATE INDEX IF NOT EXISTS idx_event_relationships_type ON public.event_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_event_relationships_strength ON public.event_relationships(strength DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_event_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_relationships_updated_at ON public.event_relationships;
CREATE TRIGGER trigger_update_event_relationships_updated_at
  BEFORE UPDATE ON public.event_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_event_relationships_updated_at();

-- RLS Policies
ALTER TABLE public.event_relationships ENABLE ROW LEVEL SECURITY;

-- Les relations sont visibles par tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Event relationships are viewable by authenticated users" ON public.event_relationships;
CREATE POLICY "Event relationships are viewable by authenticated users"
  ON public.event_relationships
  FOR SELECT
  TO authenticated
  USING (true);

-- Fonction pour obtenir toutes les relations d'un événement
CREATE OR REPLACE FUNCTION get_event_relationships(event_id UUID)
RETURNS TABLE (
  id UUID,
  source_event_id UUID,
  target_event_id UUID,
  relationship_type TEXT,
  strength NUMERIC,
  confidence NUMERIC,
  evidence TEXT,
  reasoning TEXT,
  related_event_summary TEXT,
  related_event_id UUID,
  related_event_impact_score NUMERIC,
  related_event_confidence NUMERIC,
  direction TEXT -- 'outgoing' or 'incoming'
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Relations sortantes (cet événement cause/précède/etc. d'autres)
  SELECT 
    er.id,
    er.source_event_id,
    er.target_event_id,
    er.relationship_type,
    er.strength,
    er.confidence,
    er.evidence,
    er.reasoning,
    ne_out.summary as related_event_summary,
    ne_out.id as related_event_id,
    ne_out.impact_score as related_event_impact_score,
    ne_out.confidence as related_event_confidence,
    'outgoing'::TEXT as direction
  FROM public.event_relationships er
  JOIN public.nucigen_events ne_out ON ne_out.id = er.target_event_id
  WHERE er.source_event_id = event_id
  
  UNION ALL
  
  -- Relations entrantes (d'autres événements causent/précèdent/etc. celui-ci)
  SELECT 
    er.id,
    er.source_event_id,
    er.target_event_id,
    er.relationship_type,
    er.strength,
    er.confidence,
    er.evidence,
    er.reasoning,
    ne_in.summary as related_event_summary,
    ne_in.id as related_event_id,
    ne_in.impact_score as related_event_impact_score,
    ne_in.confidence as related_event_confidence,
    'incoming'::TEXT as direction
  FROM public.event_relationships er
  JOIN public.nucigen_events ne_in ON ne_in.id = er.source_event_id
  WHERE er.target_event_id = event_id
  
  ORDER BY strength DESC, confidence DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_event_relationships TO authenticated;

-- Fonction pour obtenir le graph complet (tous les événements connectés)
CREATE OR REPLACE FUNCTION get_event_graph(root_event_id UUID, max_depth INTEGER DEFAULT 2)
RETURNS TABLE (
  event_id UUID,
  event_summary TEXT,
  event_impact_score NUMERIC,
  depth INTEGER,
  path UUID[] -- Chemin depuis l'événement racine
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE event_graph AS (
    -- Événement racine
    SELECT 
      root_event_id as event_id,
      0 as depth,
      ARRAY[root_event_id] as path
    
    UNION ALL
    
    -- Événements connectés (récursif)
    SELECT 
      CASE 
        WHEN er.source_event_id = eg.event_id THEN er.target_event_id
        ELSE er.source_event_id
      END as event_id,
      eg.depth + 1 as depth,
      eg.path || CASE 
        WHEN er.source_event_id = eg.event_id THEN er.target_event_id
        ELSE er.source_event_id
      END as path
    FROM event_graph eg
    JOIN public.event_relationships er ON (
      er.source_event_id = eg.event_id OR er.target_event_id = eg.event_id
    )
    WHERE eg.depth < max_depth
      AND NOT (CASE 
        WHEN er.source_event_id = eg.event_id THEN er.target_event_id
        ELSE er.source_event_id
      END = ANY(eg.path)) -- Éviter les cycles
  )
  SELECT DISTINCT
    eg.event_id,
    ne.summary as event_summary,
    ne.impact_score as event_impact_score,
    eg.depth,
    eg.path
  FROM event_graph eg
  JOIN public.nucigen_events ne ON ne.id = eg.event_id
  ORDER BY eg.depth, ne.impact_score DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_event_graph TO authenticated;

