/**
 * Firecrawl Ecosystem
 * 
 * Unified service that orchestrates all Firecrawl-based enrichment features:
 * - URL enrichment (automatic detection and scraping)
 * - Data extraction (structured data from documents)
 * - Deep linking (related documents discovery)
 * - Validation (fact-checking against official sources)
 * 
 * Includes parallelization for optimal performance.
 */

import { maximizeApiUsage, API_CONFIGS } from '../utils/api-optimizer';
import { enrichEventUrls, batchEnrichEventUrls, enrichUrl, EnrichedUrl } from './firecrawl-url-enricher';
import { extractStructuredDataFromUrl, extractStructuredData, saveStructuredData, StructuredData } from './firecrawl-data-extractor';
import { crawlDeepLinks, enrichEventWithDeepLinks, DocumentGraph } from './firecrawl-deep-linker';
import { validateEvent, validateAndUpdateEvent, ValidationResult } from './firecrawl-validator';
import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface FirecrawlEnrichmentOptions {
  enableUrlEnrichment?: boolean;
  enableDataExtraction?: boolean;
  enableDeepLinking?: boolean;
  enableValidation?: boolean;
  maxDeepLinkDepth?: number;
  maxDeepLinksPerDepth?: number;
  parallelize?: boolean;
}

export interface FirecrawlEnrichmentResult {
  urlEnrichment?: {
    enriched: number;
    skipped: number;
    errors: number;
    enrichedUrls: EnrichedUrl[];
  };
  dataExtraction?: {
    extracted: number;
    errors: number;
    structuredData: Array<{ url: string; data: StructuredData }>;
  };
  deepLinking?: {
    documentsFound: number;
    relationshipsCreated: number;
    graph: DocumentGraph | null;
  };
  validation?: {
    validated: number;
    errors: number;
    results: ValidationResult[];
  };
}

/**
 * Enrich a single event with all Firecrawl capabilities
 */
export async function enrichEventWithFirecrawl(
  eventId: string,
  nucigenEventId: string | null = null,
  options: FirecrawlEnrichmentOptions = {}
): Promise<FirecrawlEnrichmentResult> {
  if (!isFirecrawlAvailable()) {
    return {};
  }

  const {
    enableUrlEnrichment = true,
    enableDataExtraction = true,
    enableDeepLinking = false, // Disabled by default (can be expensive)
    enableValidation = true,
    maxDeepLinkDepth = 2,
    maxDeepLinksPerDepth = 5,
    parallelize = true,
  } = options;

  const result: FirecrawlEnrichmentResult = {};

  try {
    // 1. URL Enrichment (automatic detection and scraping)
    if (enableUrlEnrichment) {
      try {
        const urlResult = await enrichEventUrls(eventId, nucigenEventId);
        result.urlEnrichment = urlResult;
      } catch (error: any) {
        console.error('[FirecrawlEcosystem] Error enriching URLs:', error);
        result.urlEnrichment = {
          enriched: 0,
          skipped: 0,
          errors: 1,
          enrichedUrls: [],
        };
      }
    }

    // 2. Data Extraction (structured data from enriched documents)
    if (enableDataExtraction && result.urlEnrichment?.enrichedUrls) {
      try {
        const extractionResults: Array<{ url: string; data: StructuredData }> = [];
        let extracted = 0;
        let errors = 0;

        const enrichedUrls = result.urlEnrichment.enrichedUrls;

        if (parallelize) {
          // Use parallel processing with api-optimizer
          const { results, errors: extractionErrors } = await maximizeApiUsage(
            enrichedUrls,
            async (enrichedUrl) => {
              try {
                // Get document content if available, otherwise scrape again
                const { data: doc } = await supabase
                  .from('official_documents')
                  .select('content, url')
                  .eq('url', enrichedUrl.url)
                  .maybeSingle();

                if (doc?.content) {
                  const extractionResult = await extractStructuredData(
                    doc.content,
                    enrichedUrl.url,
                    enrichedUrl.source_type
                  );

                  if (extractionResult.success && extractionResult.data) {
                    await saveStructuredData(enrichedUrl.url, extractionResult.data, eventId, nucigenEventId);
                    return { url: enrichedUrl.url, data: extractionResult.data };
                  }
                }
                return null;
              } catch (error: any) {
                console.error(`[FirecrawlEcosystem] Error extracting data from ${enrichedUrl.url}:`, error);
                throw error;
              }
            },
            'firecrawl'
          );

          const validResults = results.filter(r => r !== null) as Array<{ url: string; data: StructuredData }>;
          extractionResults.push(...validResults);
          extracted = validResults.length;
          errors = extractionErrors.length;
        } else {
          // Sequential processing
          for (const enrichedUrl of enrichedUrls) {
            try {
              const { data: doc } = await supabase
                .from('official_documents')
                .select('content, url')
                .eq('url', enrichedUrl.url)
                .maybeSingle();

              if (doc?.content) {
                try {
                  const extractionResult = await extractStructuredData(
                    doc.content,
                    enrichedUrl.url,
                    enrichedUrl.source_type
                  );

                  if (extractionResult.success && extractionResult.data) {
                    await saveStructuredData(enrichedUrl.url, extractionResult.data, eventId, nucigenEventId);
                    extractionResults.push({ url: enrichedUrl.url, data: extractionResult.data });
                    extracted++;
                  } else {
                    errors++;
                  }
                } catch (error: any) {
                  console.error(`[FirecrawlEcosystem] Error extracting data from ${enrichedUrl.url}:`, error);
                  errors++;
                }
              } else {
                errors++;
              }
            } catch (error: any) {
              console.error(`[FirecrawlEcosystem] Error extracting data from ${enrichedUrl.url}:`, error);
              errors++;
            }
          }
        }

        result.dataExtraction = {
          extracted,
          errors,
          structuredData: extractionResults,
        };
      } catch (error: any) {
        console.error('[FirecrawlEcosystem] Error in data extraction:', error);
        result.dataExtraction = {
          extracted: 0,
          errors: 1,
          structuredData: [],
        };
      }
    }

    // 3. Deep Linking (discover related documents)
    if (enableDeepLinking && result.urlEnrichment?.enrichedUrls) {
      try {
        // Use first enriched URL for deep linking (or can be configured)
        const primaryUrl = result.urlEnrichment.enrichedUrls[0]?.url;
        
        if (primaryUrl) {
          const graph = await enrichEventWithDeepLinks(eventId, primaryUrl, maxDeepLinkDepth);
          
          result.deepLinking = {
            documentsFound: graph.documents.length,
            relationshipsCreated: graph.relationships.length,
            graph,
          };
        } else {
          result.deepLinking = {
            documentsFound: 0,
            relationshipsCreated: 0,
            graph: null,
          };
        }
      } catch (error: any) {
        console.error('[FirecrawlEcosystem] Error in deep linking:', error);
        result.deepLinking = {
          documentsFound: 0,
          relationshipsCreated: 0,
          graph: null,
        };
      }
    }

    // 4. Validation (fact-checking against official sources)
    if (enableValidation) {
      try {
        const validationResult = await validateAndUpdateEvent(eventId, nucigenEventId);
        
        result.validation = {
          validated: validationResult.validated ? 1 : 0,
          errors: validationResult.issues.filter(i => i.severity === 'error').length,
          results: [validationResult],
        };
      } catch (error: any) {
        console.error('[FirecrawlEcosystem] Error in validation:', error);
        result.validation = {
          validated: 0,
          errors: 1,
          results: [],
        };
      }
    }

    return result;
  } catch (error: any) {
    console.error('[FirecrawlEcosystem] Error enriching event:', error);
    return result;
  }
}

/**
 * Batch enrich multiple events with Firecrawl
 */
export async function batchEnrichEventsWithFirecrawl(
  eventIds: string[],
  options: FirecrawlEnrichmentOptions = {}
): Promise<FirecrawlEnrichmentResult> {
  if (!isFirecrawlAvailable()) {
    return {};
  }

  const { parallelize = true } = options;

  const aggregatedResult: FirecrawlEnrichmentResult = {
    urlEnrichment: { enriched: 0, skipped: 0, errors: 0, enrichedUrls: [] },
    dataExtraction: { extracted: 0, errors: 0, structuredData: [] },
    validation: { validated: 0, errors: 0, results: [] },
  };

  if (parallelize) {
    // Process events in parallel with api-optimizer
    const { results, errors } = await maximizeApiUsage(
      eventIds,
      async (eventId) => {
        // Get nucigen_event_id if exists
        const { data: nucigenEvent } = await supabase
          .from('nucigen_events')
          .select('id')
          .eq('source_event_id', eventId)
          .maybeSingle();

        return await enrichEventWithFirecrawl(eventId, nucigenEvent?.id || null, {
          ...options,
          enableDeepLinking: false, // Disable deep linking in batch mode (too expensive)
        });
      },
      'firecrawl'
    );

    // Aggregate results
    for (const result of results) {
      if (result.urlEnrichment) {
        aggregatedResult.urlEnrichment!.enriched += result.urlEnrichment.enriched;
        aggregatedResult.urlEnrichment!.skipped += result.urlEnrichment.skipped;
        aggregatedResult.urlEnrichment!.errors += result.urlEnrichment.errors;
        aggregatedResult.urlEnrichment!.enrichedUrls.push(...result.urlEnrichment.enrichedUrls);
      }
      if (result.dataExtraction) {
        aggregatedResult.dataExtraction!.extracted += result.dataExtraction.extracted;
        aggregatedResult.dataExtraction!.errors += result.dataExtraction.errors;
        aggregatedResult.dataExtraction!.structuredData.push(...result.dataExtraction.structuredData);
      }
      if (result.validation) {
        aggregatedResult.validation!.validated += result.validation.validated;
        aggregatedResult.validation!.errors += result.validation.errors;
        aggregatedResult.validation!.results.push(...result.validation.results);
      }
    }

    aggregatedResult.urlEnrichment!.errors += errors.length;
  } else {
    // Sequential processing
    for (const eventId of eventIds) {
      const { data: nucigenEvent } = await supabase
        .from('nucigen_events')
        .select('id')
        .eq('source_event_id', eventId)
        .maybeSingle();

      const result = await enrichEventWithFirecrawl(eventId, nucigenEvent?.id || null, {
        ...options,
        enableDeepLinking: false,
      });

      // Aggregate results
      if (result.urlEnrichment) {
        aggregatedResult.urlEnrichment!.enriched += result.urlEnrichment.enriched;
        aggregatedResult.urlEnrichment!.skipped += result.urlEnrichment.skipped;
        aggregatedResult.urlEnrichment!.errors += result.urlEnrichment.errors;
        aggregatedResult.urlEnrichment!.enrichedUrls.push(...result.urlEnrichment.enrichedUrls);
      }
      if (result.dataExtraction) {
        aggregatedResult.dataExtraction!.extracted += result.dataExtraction.extracted;
        aggregatedResult.dataExtraction!.errors += result.dataExtraction.errors;
        aggregatedResult.dataExtraction!.structuredData.push(...result.dataExtraction.structuredData);
      }
      if (result.validation) {
        aggregatedResult.validation!.validated += result.validation.validated;
        aggregatedResult.validation!.errors += result.validation.errors;
        aggregatedResult.validation!.results.push(...result.validation.results);
      }
    }
  }

  return aggregatedResult;
}

/**
 * Enrich pending events automatically (called by orchestrator)
 */
export async function enrichPendingEvents(
  limit: number = 20,
  options: FirecrawlEnrichmentOptions = {}
): Promise<FirecrawlEnrichmentResult> {
  try {
    // Get events that need enrichment (have URLs but no official documents)
    const { data: events, error } = await supabase
      .from('events')
      .select('id, url')
      .not('url', 'is', null)
      .limit(limit * 2); // Get more to filter

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    if (!events || events.length === 0) {
      return {};
    }

    // Filter events that don't have official documents yet
    const eventsToEnrich: string[] = [];
    for (const event of events) {
      if (!event.url) continue;

      const { data: existingDoc } = await supabase
        .from('official_documents')
        .select('id')
        .eq('event_id', event.id)
        .limit(1)
        .maybeSingle();

      if (!existingDoc) {
        eventsToEnrich.push(event.id);
      }

      if (eventsToEnrich.length >= limit) {
        break;
      }
    }

    if (eventsToEnrich.length === 0) {
      return {};
    }

    console.log(`[FirecrawlEcosystem] Enriching ${eventsToEnrich.length} events...`);

    return await batchEnrichEventsWithFirecrawl(eventsToEnrich, {
      ...options,
      parallelize: true, // Always parallelize in batch mode
    });
  } catch (error: any) {
    console.error('[FirecrawlEcosystem] Error enriching pending events:', error);
    return {};
  }
}
