-- Investigation Engine (Detective) — Schéma de données V1
-- See docs/SCHEMA_INVESTIGATION_ENGINE.md
-- Principe: on persiste un état d'investigation évolutif, pas une réponse.

-- 1. investigations (conteneur logique)
CREATE TABLE IF NOT EXISTS public.detective_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'paused', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detective_investigations_status ON public.detective_investigations(status);
CREATE INDEX IF NOT EXISTS idx_detective_investigations_updated_at ON public.detective_investigations(updated_at DESC);

-- 2. signals (observations brutes — immutables après ingestion)
CREATE TABLE IF NOT EXISTS public.detective_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.detective_investigations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  credibility NUMERIC NOT NULL CHECK (credibility >= 0 AND credibility <= 1),
  raw_text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_detective_signals_investigation_id ON public.detective_signals(investigation_id);
CREATE INDEX IF NOT EXISTS idx_detective_signals_extracted_at ON public.detective_signals(extracted_at DESC);

-- 3. nodes (faits / événements / acteurs normalisés)
CREATE TABLE IF NOT EXISTS public.detective_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.detective_investigations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event', 'actor', 'resource', 'decision', 'impact')),
  label TEXT NOT NULL,
  date DATE,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_detective_nodes_investigation_id ON public.detective_nodes(investigation_id);
CREATE INDEX IF NOT EXISTS idx_detective_nodes_date ON public.detective_nodes(date);

-- 4. edges (relations causales / d'influence)
CREATE TABLE IF NOT EXISTS public.detective_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.detective_investigations(id) ON DELETE CASCADE,
  from_node_id UUID NOT NULL REFERENCES public.detective_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES public.detective_nodes(id) ON DELETE CASCADE,
  relation TEXT NOT NULL CHECK (relation IN ('causes', 'influences', 'restricts', 'supports', 'weakens')),
  strength NUMERIC NOT NULL CHECK (strength >= 0 AND strength <= 1),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_detective_edges_investigation_id ON public.detective_edges(investigation_id);
CREATE INDEX IF NOT EXISTS idx_detective_edges_from_to ON public.detective_edges(from_node_id, to_node_id);

-- 5. paths (hypothèses causales en concurrence — output clé)
CREATE TABLE IF NOT EXISTS public.detective_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.detective_investigations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'weak', 'dead')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  hypothesis_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detective_paths_investigation_id ON public.detective_paths(investigation_id);
CREATE INDEX IF NOT EXISTS idx_detective_paths_status ON public.detective_paths(status);
CREATE INDEX IF NOT EXISTS idx_detective_paths_updated_at ON public.detective_paths(updated_at DESC);

-- 6. path_nodes (appartenance node ↔ path ; position = ordre dans le path)
CREATE TABLE IF NOT EXISTS public.detective_path_nodes (
  path_id UUID NOT NULL REFERENCES public.detective_paths(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.detective_nodes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (path_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_detective_path_nodes_path_id ON public.detective_path_nodes(path_id);
CREATE INDEX IF NOT EXISTS idx_detective_path_nodes_node_id ON public.detective_path_nodes(node_id);

-- RLS
ALTER TABLE public.detective_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detective_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detective_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detective_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detective_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detective_path_nodes ENABLE ROW LEVEL SECURITY;

-- Policies: service role full access (API filters by user/tenant in app logic)
CREATE POLICY "Service role full access detective_investigations"
  ON public.detective_investigations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access detective_signals"
  ON public.detective_signals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access detective_nodes"
  ON public.detective_nodes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access detective_edges"
  ON public.detective_edges FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access detective_paths"
  ON public.detective_paths FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access detective_path_nodes"
  ON public.detective_path_nodes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE public.detective_investigations IS 'Investigation Engine V1: conteneur logique (état d''enquête évolutif)';
COMMENT ON TABLE public.detective_signals IS 'Investigation Engine V1: observations brutes (immutables après ingestion)';
COMMENT ON TABLE public.detective_nodes IS 'Investigation Engine V1: faits/événements/acteurs normalisés (matière du graphe)';
COMMENT ON TABLE public.detective_edges IS 'Investigation Engine V1: relations causales (servent à inférer les paths)';
COMMENT ON TABLE public.detective_paths IS 'Investigation Engine V1: hypothèses causales en concurrence (output du moteur)';
COMMENT ON TABLE public.detective_path_nodes IS 'Investigation Engine V1: appartenance node↔path avec ordre (position)';
