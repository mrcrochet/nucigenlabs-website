-- ============================================
-- PHASE 4: Context & Official Documents Tables
-- For Tavily (context enrichment) and Firecrawl (official sources)
-- ============================================

-- ============================================
-- 1. EVENT CONTEXT (Tavily)
-- ============================================

-- Table: event_context
-- Stores historical context and background for events (from Tavily)
CREATE TABLE IF NOT EXISTS public.event_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucigen_event_id UUID REFERENCES public.nucigen_events(id) ON DELETE CASCADE NOT NULL,
  
  -- Contexte historique
  historical_context TEXT, -- Événements similaires passés, patterns historiques
  similar_events JSONB, -- Array de {title: string, date: string, relevance: number, url?: string}
  
  -- Explications de fond
  background_explanation TEXT, -- Explications contextuelles, pourquoi c'est important
  
  -- Validation
  validation_notes TEXT, -- Notes sur validation des second-order effects, cohérence
  
  -- Métadonnées
  enriched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_context_nucigen_event_id ON public.event_context(nucigen_event_id);
CREATE INDEX IF NOT EXISTS idx_event_context_enriched_at ON public.event_context(enriched_at DESC);

-- RLS Policies
ALTER TABLE public.event_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event context is viewable by authenticated users" ON public.event_context;
CREATE POLICY "Event context is viewable by authenticated users"
  ON public.event_context
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage event context" ON public.event_context;
CREATE POLICY "Service role can manage event context"
  ON public.event_context
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. OFFICIAL DOCUMENTS (Firecrawl)
-- ============================================

-- Table: official_documents
-- Stores official documents scraped with Firecrawl (whitelist only)
CREATE TABLE IF NOT EXISTS public.official_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  nucigen_event_id UUID REFERENCES public.nucigen_events(id) ON DELETE CASCADE,
  
  -- Document information
  url TEXT NOT NULL,
  title TEXT,
  content TEXT, -- Full scraped content
  markdown TEXT, -- Markdown version (if available)
  
  -- Source classification
  domain TEXT NOT NULL, -- Must be in whitelist
  source_type TEXT NOT NULL CHECK (source_type IN ('government', 'regulator', 'institution', 'central_bank', 'international_org')),
  
  -- Métadonnées
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure at least one reference
  CONSTRAINT official_documents_reference_check CHECK (
    (event_id IS NOT NULL) OR (nucigen_event_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_official_documents_event_id ON public.official_documents(event_id);
CREATE INDEX IF NOT EXISTS idx_official_documents_nucigen_event_id ON public.official_documents(nucigen_event_id);
CREATE INDEX IF NOT EXISTS idx_official_documents_domain ON public.official_documents(domain);
CREATE INDEX IF NOT EXISTS idx_official_documents_source_type ON public.official_documents(source_type);
CREATE INDEX IF NOT EXISTS idx_official_documents_url ON public.official_documents(url);

-- RLS Policies
ALTER TABLE public.official_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Official documents are viewable by authenticated users" ON public.official_documents;
CREATE POLICY "Official documents are viewable by authenticated users"
  ON public.official_documents
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage official documents" ON public.official_documents;
CREATE POLICY "Service role can manage official documents"
  ON public.official_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. FIRECRAWL WHITELIST (Configuration)
-- ============================================

-- Table: firecrawl_whitelist
-- Whitelist of domains allowed for Firecrawl scraping
CREATE TABLE IF NOT EXISTS public.firecrawl_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL, -- e.g., 'gov.uk', 'sec.gov'
  source_type TEXT NOT NULL CHECK (source_type IN ('government', 'regulator', 'institution', 'central_bank', 'international_org')),
  enabled BOOLEAN DEFAULT true,
  notes TEXT, -- Optional notes about the domain
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_firecrawl_whitelist_domain ON public.firecrawl_whitelist(domain);
CREATE INDEX IF NOT EXISTS idx_firecrawl_whitelist_enabled ON public.firecrawl_whitelist(enabled) WHERE enabled = true;

-- RLS Policies (read-only for authenticated, full access for service role)
ALTER TABLE public.firecrawl_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Whitelist is viewable by authenticated users" ON public.firecrawl_whitelist;
CREATE POLICY "Whitelist is viewable by authenticated users"
  ON public.firecrawl_whitelist
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage whitelist" ON public.firecrawl_whitelist;
CREATE POLICY "Service role can manage whitelist"
  ON public.firecrawl_whitelist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_firecrawl_whitelist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_firecrawl_whitelist_updated_at ON public.firecrawl_whitelist;
CREATE TRIGGER trigger_update_firecrawl_whitelist_updated_at
  BEFORE UPDATE ON public.firecrawl_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION update_firecrawl_whitelist_updated_at();

-- ============================================
-- 4. INITIAL WHITELIST DATA
-- ============================================

-- Insert default whitelist domains (only if not exists)
INSERT INTO public.firecrawl_whitelist (domain, source_type, notes)
VALUES
  -- Governments
  ('gov.uk', 'government', 'UK Government'),
  ('gov.fr', 'government', 'French Government'),
  ('gov.de', 'government', 'German Government'),
  ('gov.us', 'government', 'US Government'),
  ('europa.eu', 'government', 'European Union'),
  
  -- Regulators
  ('sec.gov', 'regulator', 'US Securities and Exchange Commission'),
  ('fca.org.uk', 'regulator', 'UK Financial Conduct Authority'),
  ('amf-france.org', 'regulator', 'French Financial Markets Authority'),
  ('bafin.de', 'regulator', 'German Federal Financial Supervisory Authority'),
  
  -- Central Banks
  ('federalreserve.gov', 'central_bank', 'US Federal Reserve'),
  ('ecb.europa.eu', 'central_bank', 'European Central Bank'),
  ('bankofengland.co.uk', 'central_bank', 'Bank of England'),
  ('banque-france.fr', 'central_bank', 'Banque de France'),
  
  -- International Organizations
  ('who.int', 'international_org', 'World Health Organization'),
  ('un.org', 'international_org', 'United Nations'),
  ('imf.org', 'international_org', 'International Monetary Fund'),
  ('worldbank.org', 'international_org', 'World Bank')
ON CONFLICT (domain) DO NOTHING;

