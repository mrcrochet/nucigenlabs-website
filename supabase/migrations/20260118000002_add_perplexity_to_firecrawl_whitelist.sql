-- ============================================
-- Add Perplexity to Firecrawl Whitelist
-- ============================================
-- 
-- Allows Firecrawl to scrape perplexity.ai for Discover tracking
--

INSERT INTO public.firecrawl_whitelist (domain, source_type, enabled, notes)
VALUES ('perplexity.ai', 'institution', true, 'Perplexity Discover tracker - tracks trending topics')
ON CONFLICT (domain) DO UPDATE 
SET enabled = true, 
    notes = 'Perplexity Discover tracker - tracks trending topics',
    updated_at = NOW();
