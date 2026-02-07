/**
 * Pipeline d'ingestion Detective.
 *
 * Deux modes :
 * - useSearchGraph (défaut) : même tech que Search — Tavily → extractEntities → extractRelationshipsFromText → buildGraph → convertSearchGraphToInvestigation → persist. Graphe type Knowledge Graph (entités, relations).
 * - useSearchGraph=false : Tavily → claims → buildGraphFromClaims → paths → persist (legacy).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { searchTavily } from './tavily-unified-service.js';
import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service.js';
import { extractDetectiveClaims, type DetectiveClaimPayload } from './detective-claim-extractor.js';
import { rebuildAndPersistGraph, persistInvestigationGraph } from './detective-graph-persistence.js';
import { extractEntities } from './entity-extractor.js';
import { extractRelationshipsFromText } from './relationship-extractor.js';
import { buildGraph } from './graph-builder.js';
import type { SearchResult } from './search-orchestrator.js';
import { convertSearchGraphToInvestigation } from './search-graph-to-investigation.js';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

export interface RunDetectiveIngestionParams {
  investigationId: string;
  hypothesis: string;
  /** Requête de recherche (défaut: hypothesis). */
  query?: string;
  /** Client Supabase (créé depuis env si absent). */
  supabase?: SupabaseClient | null;
  maxTavilyResults?: number;
  maxScrapeUrls?: number;
  /** Si true, ne pas appeler Tavily ; utiliser rawTextChunks uniquement. */
  skipTavily?: boolean;
  /** Si true, ne pas scraper avec Firecrawl ; utiliser uniquement le content des articles Tavily. */
  skipFirecrawl?: boolean;
  /**
   * Texte brut à utiliser en plus (ou à la place si skipTavily).
   * Chaque élément peut être associé à sourceUrl/sourceName dans un objet.
   */
  rawTextChunks?: Array<string | { text: string; sourceUrl?: string; sourceName?: string }>;
  /** Si true, après ingestion des claims, reconstruit et persiste le graphe (nodes, edges, paths). */
  runGraphRebuild?: boolean;
  /** Si true (défaut), construire le graphe avec la même tech que Search (entity-extractor + relationship-extractor + graph-builder). Sinon : claims → buildGraphFromClaims. */
  useSearchGraph?: boolean;
}

export interface RunDetectiveIngestionResult {
  claimsCreated: number;
  articlesProcessed: number;
  errors: string[];
  /** Présent si runGraphRebuild était true. */
  graph?: { nodesCount: number; edgesCount: number; pathsCount: number };
}

const DEFAULT_MAX_TAVILY = 10;
const DEFAULT_MAX_SCRAPE = 5;
const MIN_CONTENT_LENGTH = 500;

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  return createClient(url, key);
}

/**
 * Exécute le pipeline d'ingestion : sources → texte brut → extraction claims → insertion.
 */
export async function runDetectiveIngestion(
  params: RunDetectiveIngestionParams
): Promise<RunDetectiveIngestionResult> {
  const {
    investigationId,
    hypothesis,
    query,
    supabase: supabaseParam,
    maxTavilyResults = DEFAULT_MAX_TAVILY,
    maxScrapeUrls = DEFAULT_MAX_SCRAPE,
    skipTavily = false,
    skipFirecrawl = false,
    rawTextChunks = [],
    runGraphRebuild = false,
    useSearchGraph = true,
  } = params;

  const supabase = supabaseParam ?? getSupabase();
  const errors: string[] = [];
  let articlesProcessed = 0;
  let claimsCreated = 0;

  const queryEffective = (query ?? hypothesis).trim();
  let articles: Array<{ title: string; url: string; content?: string }> = [];

  // 1. SOURCES (Tavily) — sauf si skipTavily
  if (!skipTavily && queryEffective) {
    try {
      const result = await searchTavily(queryEffective, 'news', {
        maxResults: maxTavilyResults,
        days: 90,
      });
      articles = (result.articles || []).slice(0, maxScrapeUrls).map((a) => ({
        title: a.title || '',
        url: a.url || '',
        content: a.content,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Tavily: ${msg}`);
    }
  }

  // Textes à traiter : (article → rawText + source) + rawTextChunks
  const toProcess: Array<{ rawText: string; sourceUrl?: string; sourceName?: string }> = [];

  for (const a of articles) {
    let rawText = (a.content && a.content.length >= MIN_CONTENT_LENGTH) ? a.content : '';
    if (!rawText && !skipFirecrawl && a.url && isFirecrawlAvailable()) {
      try {
        const doc = await scrapeOfficialDocument(a.url, { checkWhitelist: false });
        rawText = (doc?.content ?? doc?.markdown ?? '').trim();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Firecrawl ${a.url}: ${msg}`);
      }
    }
    if (rawText) {
      toProcess.push({ rawText, sourceUrl: a.url, sourceName: a.title });
      articlesProcessed += 1;
    }
  }

  for (const chunk of rawTextChunks) {
    if (typeof chunk === 'string') {
      if (chunk.trim()) toProcess.push({ rawText: chunk.trim() });
    } else if (chunk?.text?.trim()) {
      toProcess.push({
        rawText: chunk.text.trim(),
        sourceUrl: chunk.sourceUrl,
        sourceName: chunk.sourceName,
      });
    }
  }

  // 1b. Mode Knowledge Graph (même tech que Search) : requête utilisateur → Tavily/sources → entities + relationships + buildGraph → convert → persist
  if (useSearchGraph && runGraphRebuild && toProcess.length > 0) {
    try {
      const results: SearchResult[] = toProcess.map((item, index) => ({
        id: `inv-${investigationId}-${Date.now()}-${index}`,
        type: 'article' as const,
        title: item.sourceName ?? '',
        summary: (item.rawText || '').substring(0, 200),
        url: item.sourceUrl ?? '',
        source: item.sourceUrl ? extractDomain(item.sourceUrl) : 'unknown',
        publishedAt: new Date().toISOString(),
        relevanceScore: 0.5,
        sourceScore: 0.5,
        entities: [],
        tags: [],
        content: item.rawText,
      }));

      const allText = results.map((r) => `${r.title} ${r.summary} ${r.content || ''}`).join('\n\n');
      const entities = await extractEntities(allText);

      const resultsWithEntities = results.map((result) => {
        const resultText = `${result.title} ${result.summary} ${result.content || ''}`.toLowerCase();
        const resultEntities = entities.filter((e) => resultText.includes(e.name.toLowerCase()));
        return {
          ...result,
          entities: resultEntities,
          tags: resultEntities.map((e) => e.name),
        };
      });

      const relationships = await extractRelationshipsFromText(allText, resultsWithEntities);
      const kg = await buildGraph(resultsWithEntities, relationships);
      const graph = convertSearchGraphToInvestigation(kg);
      const graphResult = await persistInvestigationGraph(supabase, investigationId, graph);
      return {
        claimsCreated: 0,
        articlesProcessed,
        errors,
        graph: {
          nodesCount: graphResult.nodesCount,
          edgesCount: graphResult.edgesCount,
          pathsCount: graphResult.pathsCount,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Search graph: ${msg}`);
    }
  }

  // 2. EXTRACTION + 3. PERSISTANCE (mode claims)
  for (const { rawText, sourceUrl, sourceName } of toProcess) {
    let payloads: DetectiveClaimPayload[];
    try {
      payloads = await extractDetectiveClaims({
        hypothesis,
        rawText,
        sourceUrl,
        sourceName,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Extract claims: ${msg}`);
      continue;
    }

    for (const p of payloads) {
      try {
        const { error } = await supabase.from('detective_claims').insert({
          investigation_id: investigationId,
          text: p.text,
          subject: p.subject,
          action: p.action,
          object: p.object,
          polarity: p.polarity,
          confidence: p.confidence,
          date: p.date ?? null,
          source_url: p.source_url ?? null,
          source_name: p.source_name ?? null,
          signal_id: null,
        });
        if (error) {
          errors.push(`Insert claim: ${error.message}`);
        } else {
          claimsCreated += 1;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Insert claim: ${msg}`);
      }
    }
  }

  if (runGraphRebuild && claimsCreated >= 0) {
    try {
      const graphResult = await rebuildAndPersistGraph(supabase, investigationId);
      return {
        claimsCreated,
        articlesProcessed,
        errors,
        graph: {
          nodesCount: graphResult.nodesCount,
          edgesCount: graphResult.edgesCount,
          pathsCount: graphResult.pathsCount,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Graph rebuild: ${msg}`);
    }
  }

  return { claimsCreated, articlesProcessed, errors };
}
