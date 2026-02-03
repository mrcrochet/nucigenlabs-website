-- Detective Engine — Claims (couche canonique Signal → Claim → Node/Edge)
-- See docs/SCHEMA_INVESTIGATION_ENGINE.md § 2b.
-- Le graphe ne consomme que des claims structurés, jamais du texte brut.

CREATE TABLE IF NOT EXISTS public.detective_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.detective_investigations(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  subject TEXT NOT NULL,
  action TEXT NOT NULL,
  object TEXT NOT NULL,
  polarity TEXT NOT NULL CHECK (polarity IN ('supports', 'weakens', 'neutral')),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  date DATE,
  source_url TEXT,
  source_name TEXT,
  signal_id UUID REFERENCES public.detective_signals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detective_claims_investigation_id ON public.detective_claims(investigation_id);
CREATE INDEX IF NOT EXISTS idx_detective_claims_signal_id ON public.detective_claims(signal_id);
CREATE INDEX IF NOT EXISTS idx_detective_claims_created_at ON public.detective_claims(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detective_claims_polarity ON public.detective_claims(polarity);

ALTER TABLE public.detective_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access detective_claims"
  ON public.detective_claims FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.detective_claims IS 'Investigation Engine V1: claims structurés (extraction depuis Signal); le graphe ne consomme que des claims';
COMMENT ON COLUMN public.detective_claims.subject IS 'Acteur / entité';
COMMENT ON COLUMN public.detective_claims.action IS 'Fait / événement';
COMMENT ON COLUMN public.detective_claims.object IS 'Cible / ressource / impact';
COMMENT ON COLUMN public.detective_claims.polarity IS 'supports | weakens | neutral (par rapport à l''hypothèse)';
