/**
 * Perplexity Discover Tracker
 * 
 * Utilise Firecrawl Agent pour tracker la page Discover de Perplexity
 * et enrichir notre propre feed Discover avec les actualités
 */

import { scrapeOfficialDocument } from '../phase4/firecrawl-official-service';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Perplexity Tracker] Missing Supabase config');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn('[Perplexity Tracker] OPENAI_API_KEY not configured');
}

const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// URL de la page Discover de Perplexity
const PERPLEXITY_DISCOVER_URL = 'https://www.perplexity.ai/discover';

interface PerplexityTopic {
  title: string;
  summary: string;
  category: string;
  sources: Array<{ name: string; url: string; date: string }>;
  thumbnail?: string;
  tags: string[];
  relevance_score: number;
}

/**
 * Scrape la page Discover de Perplexity avec Firecrawl
 * Fallback vers Tavily si Firecrawl échoue
 */
async function scrapePerplexityDiscover(): Promise<string | null> {
  try {
    console.log('[Perplexity Tracker] Attempting to scrape Perplexity Discover page with Firecrawl...');
    
    const document = await scrapeOfficialDocument(PERPLEXITY_DISCOVER_URL, {
      checkWhitelist: false, // Permissif pour Perplexity
    });

    if (document && document.content && document.content.length > 100) {
      console.log(`[Perplexity Tracker] Successfully scraped ${document.content.length} characters with Firecrawl`);
      return document.content;
    }

    // Fallback: Utiliser Tavily pour rechercher les topics Perplexity
    console.log('[Perplexity Tracker] Firecrawl failed, trying Tavily as fallback...');
    return await searchPerplexityTopicsWithTavily();
  } catch (error: any) {
    console.error('[Perplexity Tracker] Error scraping:', error.message);
    // Try Tavily fallback
    console.log('[Perplexity Tracker] Trying Tavily fallback...');
    return await searchPerplexityTopicsWithTavily();
  }
}

/**
 * Recherche les topics trending avec Tavily comme fallback
 * Au lieu de scraper Perplexity, on recherche directement les topics trending
 */
async function searchPerplexityTopicsWithTavily(): Promise<string | null> {
  try {
    const { searchTavily } = await import('../services/tavily-unified-service');
    
    // Rechercher les trending topics actuels (approche alternative)
    const queries = [
      'trending topics today finance geopolitics technology',
      'breaking news today market moving events',
      'top stories today business technology',
    ];

    let allContent = 'Trending Topics and Current Events:\n\n';

    for (const query of queries) {
      try {
        const result = await searchTavily(query, 'news', {
          maxResults: 10,
          searchDepth: 'basic',
        });

        if (result.articles && result.articles.length > 0) {
          const articlesContent = result.articles
            .map(article => `Title: ${article.title}\nSummary: ${article.content || article.summary || ''}\nSource: ${article.url}\n`)
            .join('\n---\n\n');
          allContent += articlesContent + '\n\n';
        }
      } catch (err: any) {
        console.warn(`[Perplexity Tracker] Tavily query failed for "${query}":`, err.message);
      }
    }

    if (allContent.length > 500) {
      console.log(`[Perplexity Tracker] Collected ${allContent.length} characters from Tavily (trending topics)`);
      return allContent;
    }

    console.warn('[Perplexity Tracker] Tavily fallback collected insufficient content');
    return null;
  } catch (error: any) {
    console.error('[Perplexity Tracker] Tavily fallback error:', error.message);
    return null;
  }
}

/**
 * Extrait les topics de Perplexity avec OpenAI
 */
async function extractTopicsFromContent(content: string): Promise<PerplexityTopic[]> {
  if (!openaiClient) {
    console.warn('[Perplexity Tracker] OpenAI not available, skipping extraction');
    return [];
  }

  try {
    console.log('[Perplexity Tracker] Extracting topics with OpenAI...');

    // Limiter la taille du contenu pour éviter token overflow
    const maxContentLength = 50000;
    const truncatedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength) + '...'
      : content;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Tu es un extracteur de topics pour une plateforme d'intelligence stratégique.
Extrait les topics/trends pertinents depuis le contenu fourni (peut venir de Perplexity Discover ou de recherches Tavily sur les topics trending).

Retourne UNIQUEMENT un objet JSON valide au format suivant:
{
  "topics": [
    {
      "title": "Titre du topic",
      "summary": "Résumé en 2-3 phrases",
      "category": "tech|finance|geopolitics|energy|supply-chain",
      "sources": [
        {"name": "Source Name", "url": "https://...", "date": "2026-01-18"}
      ],
      "thumbnail": "https://...",
      "tags": ["tag1", "tag2"],
      "relevance_score": 85
    }
  ]
}

Instructions:
- Extrait 5-15 topics les plus pertinents
- Focus sur les topics pertinents pour décideurs, analystes, investisseurs
- Ignore les topics non-pertinents (sports, entertainment, celebrity gossip, etc.)
- Si le contenu vient de Tavily (articles), extrais les URLs des sources mentionnées
- Assign un relevance_score entre 70-95 basé sur l'importance stratégique
- Catégorise correctement (tech, finance, geopolitics, energy, supply-chain)
- Retourne UNIQUEMENT du JSON, pas de texte avant ou après`
        },
        {
          role: 'user',
          content: `Extrait les topics de cette page Discover et retourne-les en JSON:\n\n${truncatedContent}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 4000,
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      console.warn('[Perplexity Tracker] No content in OpenAI response');
      return [];
    }

    try {
      const parsed = JSON.parse(responseContent);
      const topics = parsed.topics || [];
      console.log(`[Perplexity Tracker] Extracted ${topics.length} topics`);
      return topics;
    } catch (parseError: any) {
      console.error('[Perplexity Tracker] Error parsing OpenAI response:', parseError.message);
      return [];
    }
  } catch (error: any) {
    console.error('[Perplexity Tracker] Error extracting topics:', error.message);
    return [];
  }
}

/**
 * Transforme un topic Perplexity en DiscoverItemRaw
 */
function transformToDiscoverItem(topic: PerplexityTopic, index: number): any {
  // Calculer le score et tier
  const score = topic.relevance_score || 70;
  let tier: 'critical' | 'strategic' | 'background' = 'strategic';
  if (score >= 90) tier = 'critical';
  else if (score < 70) tier = 'background';

  // Déterminer le consensus basé sur le nombre de sources
  let consensus: 'high' | 'fragmented' | 'disputed' = 'fragmented';
  const sourceCount = topic.sources?.length || 0;
  if (sourceCount >= 40) consensus = 'high';
  else if (sourceCount < 15) consensus = 'disputed';

  // Normaliser la catégorie
  const categoryMap: Record<string, string> = {
    'tech': 'tech',
    'technology': 'tech',
    'finance': 'finance',
    'financial': 'finance',
    'geopolitics': 'geopolitics',
    'geopolitical': 'geopolitics',
    'energy': 'energy',
    'supply-chain': 'supply-chain',
    'supply chain': 'supply-chain',
  };
  const normalizedCategory = categoryMap[topic.category?.toLowerCase()] || 'all';

  return {
    source: 'perplexity_discover',
    source_id: `perplexity-${Date.now()}-${index}`,
    title: topic.title,
    description: topic.summary,
    content: topic.summary,
    published_at: new Date().toISOString(),
    url: PERPLEXITY_DISCOVER_URL,
    language: 'en',
    status: 'pending',
    
    // Discover fields
    discover_type: 'trend', // Les topics Perplexity sont des trends
    discover_category: normalizedCategory,
    discover_tags: topic.tags || [],
    discover_thumbnail: topic.thumbnail,
    discover_sources: topic.sources || [],
    discover_score: score,
    discover_tier: tier,
    discover_consensus: consensus,
    discover_article_count: topic.sources?.length || 0,
  };
}

/**
 * Tracker principal
 */
export async function trackPerplexityDiscover(): Promise<{
  scraped: boolean;
  topicsFound: number;
  inserted: number;
  skipped: number;
  errors: number;
}> {
  console.log('[Perplexity Tracker] Starting tracking cycle...');

  let topicsFound = 0;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // 1. Scrape avec Firecrawl
    const content = await scrapePerplexityDiscover();
    if (!content) {
      return { scraped: false, topicsFound: 0, inserted: 0, skipped: 0, errors: 1 };
    }

    // 2. Extraire les topics avec OpenAI
    const topics = await extractTopicsFromContent(content);
    topicsFound = topics.length;
    console.log(`[Perplexity Tracker] Found ${topicsFound} topics`);

    if (topicsFound === 0) {
      return { scraped: true, topicsFound: 0, inserted: 0, skipped: 0, errors: 0 };
    }

    // 3. Transformer et insérer dans events
    for (let i = 0; i < topics.length; i++) {
      try {
        const item = transformToDiscoverItem(topics[i], i);

        // Vérifier si déjà existant (par source_id ou titre similaire)
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('source', 'perplexity_discover')
          .eq('source_id', item.source_id)
          .maybeSingle();

        if (existing) {
          // Mettre à jour l'existant
          const { error: updateError } = await supabase
            .from('events')
            .update({
              discover_score: item.discover_score,
              discover_tier: item.discover_tier,
              discover_consensus: item.discover_consensus,
              discover_sources: item.discover_sources,
              discover_tags: item.discover_tags,
              discover_thumbnail: item.discover_thumbnail,
              discover_category: item.discover_category,
              updated_at: new Date().toISOString(),
            } as any)
            .eq('id', existing.id);

          if (updateError) {
            console.error(`[Perplexity Tracker] Error updating: ${updateError.message}`);
            errors++;
          } else {
            skipped++;
          }
        } else {
          // Insérer nouveau
          const { error: insertError } = await supabase
            .from('events')
            .insert(item as any);

          if (insertError) {
            console.error(`[Perplexity Tracker] Error inserting: ${insertError.message}`);
            errors++;
          } else {
            inserted++;
          }
        }
      } catch (error: any) {
        console.error(`[Perplexity Tracker] Error processing topic ${i}:`, error.message);
        errors++;
      }
    }

    console.log(`[Perplexity Tracker] Complete: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);

    return {
      scraped: true,
      topicsFound,
      inserted,
      skipped,
      errors,
    };
  } catch (error: any) {
    console.error('[Perplexity Tracker] Fatal error:', error.message);
    return {
      scraped: false,
      topicsFound: 0,
      inserted: 0,
      skipped: 0,
      errors: 1,
    };
  }
}

// Export pour utilisation dans pipeline
export default trackPerplexityDiscover;
