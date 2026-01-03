/**
 * PHASE 4: Firecrawl Official Service (CORRECTED)
 * 
 * Scrapes official documents ONLY from whitelisted domains.
 * Firecrawl is NOT used for broad news scraping.
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!firecrawlApiKey) {
  console.warn('[Firecrawl] FIRECRAWL_API_KEY not set. Firecrawl features will be disabled.');
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[Firecrawl] Supabase not configured. Whitelist check will be disabled.');
}

let firecrawlApp: FirecrawlApp | null = null;
let supabase: ReturnType<typeof createClient> | null = null;

if (firecrawlApiKey) {
  try {
    firecrawlApp = new FirecrawlApp({ apiKey: firecrawlApiKey });
  } catch (error) {
    console.error('[Firecrawl] Failed to initialize FirecrawlApp:', error);
  }
}

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    // Fallback: simple regex
    const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
    return match ? match[1] : '';
  }
}

/**
 * Check if a domain is in the whitelist
 */
async function isDomainWhitelisted(domain: string): Promise<boolean> {
  if (!supabase) {
    console.warn('[Firecrawl] Supabase not configured. Skipping whitelist check.');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('firecrawl_whitelist')
      .select('domain, enabled')
      .eq('domain', domain)
      .eq('enabled', true)
      .maybeSingle();

    if (error) {
      console.error('[Firecrawl] Error checking whitelist:', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('[Firecrawl] Error checking whitelist:', error);
    return false;
  }
}

/**
 * Get source type for a domain
 */
async function getSourceType(domain: string): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('firecrawl_whitelist')
      .select('source_type')
      .eq('domain', domain)
      .eq('enabled', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return (data as { source_type: string }).source_type;
  } catch (error) {
    return null;
  }
}

export interface ScrapedOfficialDocument {
  content: string;
  markdown?: string;
  domain: string;
  source_type: string;
  title?: string;
  metadata?: any;
}

/**
 * Scrape an official document with Firecrawl (whitelist check required)
 */
export async function scrapeOfficialDocument(
  url: string,
  options: {
    checkWhitelist?: boolean;
    skipWhitelistCheck?: boolean; // For testing only
  } = {}
): Promise<ScrapedOfficialDocument | null> {
  if (!firecrawlApp) {
    console.warn('[Firecrawl] Firecrawl not initialized. Skipping scrape for:', url);
    return null;
  }

  if (!url || !url.startsWith('http')) {
    console.warn('[Firecrawl] Invalid URL:', url);
    return null;
  }

  const { checkWhitelist = true, skipWhitelistCheck = false } = options;

  // Check whitelist (unless explicitly skipped for testing)
  if (checkWhitelist && !skipWhitelistCheck) {
    const domain = extractDomain(url);
    const isWhitelisted = await isDomainWhitelisted(domain);

    if (!isWhitelisted) {
      console.log(`[Firecrawl] Domain ${domain} not in whitelist. Skipping: ${url}`);
      return null;
    }

    console.log(`[Firecrawl] Domain ${domain} is whitelisted. Proceeding with scrape.`);
  }

  try {
    console.log(`[Firecrawl] Scraping official document: ${url}`);

    const response = await firecrawlApp.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      timeout: 30000,
    });

    // Check if response is an error
    if (!response || 'error' in response) {
      console.warn('[Firecrawl] Error or no data returned for:', url);
      return null;
    }

    // Type guard: response is ScrapeResponse
    if (!('data' in response) || !response.data) {
      console.warn('[Firecrawl] No data in response for:', url);
      return null;
    }

    const data = response.data as any; // Firecrawl response data structure
    const domain = extractDomain(url);
    const source_type = await getSourceType(domain) || 'institution';

    return {
      content: data.markdown || data.content || '',
      markdown: data.markdown,
      domain: domain,
      source_type: source_type,
      title: data.metadata?.title,
      metadata: data.metadata,
    };
  } catch (error: any) {
    console.error(`[Firecrawl] Error scraping ${url}:`, error.message);
    
    if (error.message?.includes('rate limit')) {
      throw new Error('Firecrawl rate limit exceeded. Please wait before retrying.');
    }
    if (error.message?.includes('timeout')) {
      throw new Error('Firecrawl request timed out.');
    }
    
    return null;
  }
}

/**
 * Check if Firecrawl is available
 */
export function isFirecrawlAvailable(): boolean {
  return firecrawlApp !== null;
}

