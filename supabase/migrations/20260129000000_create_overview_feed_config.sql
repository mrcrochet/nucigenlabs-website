-- ============================================
-- Overview Feed Config – User/configurable Overview map filters
-- ============================================

CREATE TABLE IF NOT EXISTS public.overview_feed_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  sources_enabled TEXT[] DEFAULT NULL,
  categories_enabled TEXT[] DEFAULT NULL,
  types_enabled TEXT[] DEFAULT NULL,
  min_importance INT DEFAULT 0 CHECK (min_importance >= 0 AND min_importance <= 100),
  max_signals INT DEFAULT 12 CHECK (max_signals >= 1 AND max_signals <= 50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_overview_feed_config_user_id ON public.overview_feed_config(user_id);

CREATE OR REPLACE FUNCTION update_overview_feed_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS overview_feed_config_updated_at ON public.overview_feed_config;
CREATE TRIGGER overview_feed_config_updated_at
  BEFORE UPDATE ON public.overview_feed_config
  FOR EACH ROW
  EXECUTE FUNCTION update_overview_feed_config_updated_at();

ALTER TABLE public.overview_feed_config ENABLE ROW LEVEL SECURITY;

-- Access only via service_role (API server). Clerk auth does not set auth.uid(), so user policies are skipped.
CREATE POLICY "Service role full access overview_feed_config"
  ON public.overview_feed_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.overview_feed_config IS 'Overview map feed configuration: sources, types, thresholds per user or global';
