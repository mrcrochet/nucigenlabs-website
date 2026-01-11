/**
 * Firecrawl Deep Linker
 * 
 * Intelligently follows links in official documents to discover related documents.
 * Creates a graph of related documents and enriches events with multi-document context.
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';
import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let firecrawlApp: FirecrawlApp | null = null;

if (firecrawlApiKey && isFirecrawlAvailable()) {
  try {
    firecrawlApp = new FirecrawlApp({ apiKey: firecrawlApiKey });
  } catch (error) {
    console.error('[FirecrawlDeepLinker] Failed to initialize FirecrawlApp:', error);
  }
}

export interface LinkedDocument {
  url: string;
  title?: string;
  domain: string;
  source_type: string;
  content: string;
  link_text?: string; // Text that linked to this document
  relevance_score?: number; // 0-1 score of relevance
  depth: number; // Depth from original document
}

export interface DocumentGraph {
  rootUrl: string;
  documents: LinkedDocument[];
  relationships: Array<{
    source: string;
    target: string;
    link_text: string;
  }>;
}

/**
 * Extract links from document content
 */
function extractLinks(content: string, baseUrl: string): Array<{ url: string; text: string }> {
  const links: Array<{ url: string; text: string }> = [];
  
  // Match markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  let match;
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const linkText = match[1];
    let linkUrl = match[2];
    
    // Resolve relative URLs
    try {
      linkUrl = new URL(linkUrl, baseUrl).href;
      links.push({ url: linkUrl, text: linkText });
    } catch {
      // Invalid URL, skip
    }
  }
  
  // Match HTML links <a href="url">text</a>
  const htmlLinkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  while ((match = htmlLinkRegex.exec(content)) !== null) {
    const linkUrl = match[1];
    const linkText = match[2];
    
    try {
      const resolvedUrl = new URL(linkUrl, baseUrl).href;
      links.push({ url: resolvedUrl, text: linkText.trim() });
    } catch {
      // Invalid URL, skip
    }
  }
  
  return links;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
    return match ? match[1] : '';
  }
}

/**
 * Check if a domain is whitelisted
 */
async function isDomainWhitelisted(domain: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('firecrawl_whitelist')
      .select('domain, enabled')
      .eq('domain', domain)
      .eq('enabled', true)
      .maybeSingle();

    if (error) {
      return false;
    }

    return data !== null;
  } catch {
    return false;
  }
}

/**
 * Check if URL has already been scraped
 */
async function isUrlAlreadyScraped(url: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('official_documents')
      .select('id')
      .eq('url', url)
      .limit(1)
      .maybeSingle();

    return data !== null;
  } catch {
    return false;
  }
}

/**
 * Filter and rank links by relevance
 */
function filterRelevantLinks(
  links: Array<{ url: string; text: string }>,
  baseDomain: string,
  maxLinks: number = 10
): Array<{ url: string; text: string; score: number }> {
  const scoredLinks = links.map(link => {
    const domain = extractDomain(link.url);
    let score = 0.5; // Base score

    // Same domain = higher relevance
    if (domain === baseDomain) {
      score += 0.3;
    }

    // Keywords that indicate important documents
    const importantKeywords = [
      'regulation', 'policy', 'guidance', 'directive', 'announcement',
      'decision', 'report', 'statement', 'proposal', 'amendment',
      'filing', 'disclosure', 'notification', 'advisory'
    ];

    const linkTextLower = link.text.toLowerCase();
    const urlLower = link.url.toLowerCase();

    for (const keyword of importantKeywords) {
      if (linkTextLower.includes(keyword) || urlLower.includes(keyword)) {
        score += 0.2;
      }
    }

    // PDF documents often contain important information
    if (urlLower.includes('.pdf')) {
      score += 0.1;
    }

    return { ...link, score };
  });

  // Sort by score and limit
  return scoredLinks
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLinks);
}

/**
 * Crawl deep links from a document
 */
export async function crawlDeepLinks(
  rootUrl: string,
  maxDepth: number = 2,
  maxLinksPerDepth: number = 5
): Promise<DocumentGraph> {
  if (!firecrawlApp || !isFirecrawlAvailable()) {
    return {
      rootUrl,
      documents: [],
      relationships: [],
    };
  }

  const graph: DocumentGraph = {
    rootUrl,
    documents: [],
    relationships: [],
  };

  const visited = new Set<string>();
  const toProcess: Array<{ url: string; depth: number; linkText?: string }> = [
    { url: rootUrl, depth: 0 },
  ];

  const rootDomain = extractDomain(rootUrl);

  while (toProcess.length > 0 && graph.documents.length < 50) { // Max 50 documents
    const current = toProcess.shift();
    if (!current || current.depth > maxDepth) continue;

    const url = current.url;
    if (visited.has(url)) continue;
    visited.add(url);

    const domain = extractDomain(url);
    
    // Only process whitelisted domains
    const isWhitelisted = await isDomainWhitelisted(domain);
    if (!isWhitelisted) continue;

    // Check if already scraped
    const alreadyScraped = await isUrlAlreadyScraped(url);
    if (alreadyScraped) {
      // Get existing document
      const { data } = await supabase
        .from('official_documents')
        .select('*')
        .eq('url', url)
        .maybeSingle();

      if (data && current.depth > 0) {
        // Add to graph if not root
        graph.documents.push({
          url: data.url,
          title: data.title,
          domain: data.domain,
          source_type: data.source_type,
          content: data.content,
          link_text: current.linkText,
          depth: current.depth,
        });

        if (current.linkText) {
          graph.relationships.push({
            source: current.depth === 1 ? rootUrl : 'parent',
            target: url,
            link_text: current.linkText,
          });
        }
      }
      continue;
    }

    try {
      // Scrape document
      const document = await scrapeOfficialDocument(url, { checkWhitelist: false });

      if (!document || !document.content) {
        continue;
      }

      // Get source type
      const { data: whitelistEntry } = await supabase
        .from('firecrawl_whitelist')
        .select('source_type')
        .eq('domain', domain)
        .eq('enabled', true)
        .maybeSingle();

      const sourceType = whitelistEntry?.source_type || 'institution';

      // Add to graph
      if (current.depth > 0 || graph.documents.length === 0) {
        graph.documents.push({
          url,
          title: document.title,
          domain,
          source_type: sourceType,
          content: document.content,
          link_text: current.linkText,
          depth: current.depth,
        });

        // Save to database
        await supabase.from('official_documents').insert({
          url,
          title: document.title,
          content: document.content,
          markdown: document.markdown,
          domain,
          source_type: sourceType,
          metadata: document.metadata,
        });

        if (current.linkText && current.depth > 0) {
          graph.relationships.push({
            source: current.depth === 1 ? rootUrl : graph.documents[graph.documents.length - 2]?.url || rootUrl,
            target: url,
            link_text: current.linkText,
          });
        }
      }

      // Extract and process links if not at max depth
      if (current.depth < maxDepth) {
        const links = extractLinks(document.content, url);
        const relevantLinks = filterRelevantLinks(links, rootDomain, maxLinksPerDepth);

        for (const link of relevantLinks) {
          const linkDomain = extractDomain(link.url);
          const isLinkWhitelisted = await isDomainWhitelisted(linkDomain);
          
          if (isLinkWhitelisted && !visited.has(link.url)) {
            toProcess.push({
              url: link.url,
              depth: current.depth + 1,
              linkText: link.text,
            });
          }
        }
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`[FirecrawlDeepLinker] Error crawling ${url}:`, error.message);
      continue;
    }
  }

  return graph;
}

/**
 * Enrich an event with related documents from deep linking
 */
export async function enrichEventWithDeepLinks(
  eventId: string,
  rootUrl: string,
  maxDepth: number = 2
): Promise<DocumentGraph> {
  const graph = await crawlDeepLinks(rootUrl, maxDepth);

  // Link documents to event
  if (graph.documents.length > 0) {
    const { data: nucigenEvent } = await supabase
      .from('nucigen_events')
      .select('id')
      .eq('source_event_id', eventId)
      .maybeSingle();

    for (const doc of graph.documents) {
      await supabase
        .from('official_documents')
        .update({
          event_id: eventId,
          nucigen_event_id: nucigenEvent?.id || null,
        })
        .eq('url', doc.url);
    }
  }

  return graph;
}
