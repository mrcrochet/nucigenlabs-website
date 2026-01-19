/**
 * Discover Collector Worker
 * 
 * Ingestion EventRegistry → events table (with discover_* columns)
 * 
 * Strategy:
 * - events remains the single source of truth
 * - Discover = projection/state of events with discover_* columns
 * - Scoring interne (sans LLM) pour trier
 * - Pas d'enrichissement Perplexity ici (fait par discover-enricher.ts)
 * 
 * Categories:
 * - all: geopolitics, finance, technology, energy, supply chain
 * - tech: technology, AI, semiconductors, software
 * - finance: finance, markets, banking, monetary policy
 * - geopolitics: geopolitics, international relations, conflicts, diplomacy
 * - energy: energy, oil, gas, renewables, commodities
 * - supply-chain: supply chain, logistics, manufacturing, trade
 */

import { searchArticles, searchEvents, getTrendingConcepts, type Article, type Event as EventRegistryEvent, type TrendingConcept } from '../services/eventregistry-service.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables (same pattern as other workers)
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

// Use service_role key for workers (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Discover Collector] Missing Supabase config:');
  console.error('  SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
}

console.log(`[Discover Collector] Supabase configured: ${supabaseUrl.substring(0, 30)}... (service_role key: ${supabaseServiceKey.substring(0, 20)}...)`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client for real-time enrichment
const openaiApiKey = process.env.OPENAI_API_KEY;
let openaiClient: OpenAI | null = null;

if (openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: openaiApiKey });
  console.log('[Discover Collector] OpenAI client initialized for real-time enrichment');
} else {
  console.warn('[Discover Collector] OPENAI_API_KEY not configured - enrichment will be skipped');
}

interface DiscoverItemRaw {
  // Core event fields
  source: string;
  source_id: string;
  title: string;
  description: string;
  content: string;
  published_at: string;
  url?: string;
  author?: string;
  language: string;
  raw_category?: string;
  raw_tags?: string[];
  status: 'pending' | 'processing' | 'processed' | 'error';
  
  // Discover-specific fields
  discover_type: 'article' | 'event' | 'trend';
  discover_category: string;
  discover_tags: string[];
  discover_thumbnail?: string;
  discover_sources: Array<{ name: string; url: string; date: string }>;
  discover_concepts?: Array<{ uri: string; label: string; score: number }>;
  discover_location?: { label: string; country?: string };
  discover_sentiment?: 'positive' | 'negative' | 'neutral';
  discover_article_count?: number;
  
  // Scoring (calculated internally, no LLM)
  discover_score: number;
  discover_tier: 'critical' | 'strategic' | 'background';
  discover_consensus: 'high' | 'fragmented' | 'disputed';
}

/**
 * Blacklist de keywords à exclure (bruit, non-pertinent)
 */
const BLACKLIST_KEYWORDS = [
  'sports', 'entertainment', 'celebrity', 'gossip', 'movie', 'music',
  'weather', 'horoscope', 'recipe', 'cooking', 'fashion', 'beauty',
  'lifestyle', 'travel', 'tourism', 'restaurant', 'food review'
];

/**
 * Concepts prioritaires (indicateurs de pertinence élevée)
 */
const PRIORITY_CONCEPTS = [
  'Federal Reserve', 'European Central Bank', 'OPEC', 'World Bank', 'IMF',
  'Semiconductor', 'Supply Chain', 'Trade War', 'Sanctions',
  'Geopolitical Conflict', 'Energy Crisis', 'Inflation', 'Monetary Policy',
  'Interest Rates', 'Central Bank', 'Trade Dispute', 'Diplomatic Crisis'
];

/**
 * Seuils de qualité minimum
 */
const MIN_SCORE = 60; // Score minimum de pertinence
const MIN_ARTICLE_COUNT = 3; // Pour les events, minimum 3 articles
const MIN_CONCEPT_SCORE = 0.3; // Score minimum des concepts

/**
 * Map category to EventRegistry keywords (amélioré avec keywords spécifiques)
 */
function mapCategoryToKeywords(category: string): string[] {
  const mapping: Record<string, string[]> = {
    all: [
      // Geopolitics - spécifique
      'geopolitical conflict', 'trade war', 'sanctions', 'diplomatic crisis',
      'international relations', 'military escalation',
      // Finance - spécifique  
      'Federal Reserve', 'monetary policy', 'interest rates', 'inflation',
      'central bank', 'bond market', 'currency devaluation',
      // Tech - spécifique
      'semiconductor', 'AI regulation', 'tech policy', 'cybersecurity',
      'chip manufacturing', 'data privacy regulation',
      // Energy - spécifique
      'OPEC', 'energy crisis', 'oil prices', 'renewable energy policy',
      'nuclear energy', 'gas pipeline'
    ],
    tech: [
      'semiconductor supply chain', 'AI regulation', 'tech antitrust',
      'cybersecurity breach', 'data privacy regulation', 'chip manufacturing',
      'quantum computing', 'tech policy', 'software regulation'
    ],
    finance: [
      'Federal Reserve decision', 'monetary policy', 'interest rate hike',
      'inflation data', 'central bank', 'bond market', 'currency devaluation',
      'financial regulation', 'banking crisis', 'quantitative easing',
      'yield curve', 'credit markets'
    ],
    geopolitics: [
      'geopolitical conflict', 'trade war', 'sanctions', 'diplomatic crisis',
      'international relations', 'military escalation', 'peace treaty',
      'alliance', 'treaty', 'embargo', 'trade dispute'
    ],
    energy: [
      'OPEC decision', 'oil prices', 'energy crisis', 'renewable energy',
      'nuclear energy', 'gas pipeline', 'energy transition', 'fossil fuels',
      'energy security', 'commodity prices'
    ],
    'supply-chain': [
      'supply chain disruption', 'logistics crisis', 'manufacturing',
      'trade route', 'shipping', 'port congestion', 'container shipping',
      'global trade', 'export restrictions'
    ],
  };
  
  return mapping[category] || [category];
}

/**
 * Build personalized keywords from user preferences
 */
function buildPersonalizedKeywords(
  userPreferences?: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
    focus_areas?: string[];
  }
): string[] {
  if (!userPreferences) {
    return [];
  }

  const keywords: string[] = [];
  
  // Mapper les secteurs aux keywords spécifiques
  if (userPreferences.preferred_sectors) {
    for (const sector of userPreferences.preferred_sectors) {
      switch (sector.toLowerCase()) {
        case 'technology':
        case 'tech':
          keywords.push('semiconductor', 'AI regulation', 'tech policy', 'cybersecurity');
          break;
        case 'finance':
          keywords.push('Federal Reserve', 'monetary policy', 'interest rates', 'inflation');
          break;
        case 'energy':
          keywords.push('OPEC', 'energy crisis', 'oil prices', 'renewable energy');
          break;
        case 'geopolitics':
          keywords.push('geopolitical conflict', 'trade war', 'sanctions', 'diplomatic crisis');
          break;
        case 'supply chain':
        case 'supply-chain':
          keywords.push('supply chain disruption', 'logistics crisis', 'manufacturing');
          break;
      }
    }
  }
  
  // Ajouter les focus areas directement (sont déjà spécifiques)
  if (userPreferences.focus_areas && userPreferences.focus_areas.length > 0) {
    keywords.push(...userPreferences.focus_areas);
  }
  
  return keywords;
}

/**
 * Check if item should be filtered out (blacklist, quality checks)
 */
function shouldFilterItem(
  title: string,
  concepts: Array<{ label: string; score?: number }>,
  score: number,
  articleCount?: number
): boolean {
  const titleLower = title.toLowerCase();
  
  // FILTRE 1: Blacklist keywords
  if (BLACKLIST_KEYWORDS.some(blacklisted => titleLower.includes(blacklisted))) {
    return true; // Rejeter
  }
  
  // FILTRE 2: Vérifier concepts pertinents
  const hasRelevantConcept = concepts.some(c => {
    const label = typeof c.label === 'string' ? c.label : String(c.label || '');
    return PRIORITY_CONCEPTS.some(pc => 
      label.toLowerCase().includes(pc.toLowerCase())
    );
  });
  
  // FILTRE 3: Score minimum (mais accepter si concept pertinent)
  if (score < MIN_SCORE && !hasRelevantConcept) {
    return true; // Rejeter si score trop bas ET pas de concept pertinent
  }
  
  // FILTRE 4: Pour les events, vérifier article count
  if (articleCount !== undefined && articleCount < MIN_ARTICLE_COUNT && !hasRelevantConcept) {
    return true; // Rejeter si trop peu d'articles ET pas de concept pertinent
  }
  
  // FILTRE 5: Concepts avec score trop faible
  const hasHighScoreConcept = concepts.some(c => (c.score || 0) >= MIN_CONCEPT_SCORE);
  if (!hasHighScoreConcept && score < 70) {
    return true; // Rejeter si pas de concept avec bon score ET score global faible
  }
  
  return false; // Accepter
}

/**
 * Calculate relevance score (internal, no LLM) - AMÉLIORÉ
 * 
 * Scoring factors:
 * - Article count (for events): up to 30 points
 * - Concepts score: up to 30 points (boost si concept prioritaire)
 * - Recency: up to 20 points (exponential decay)
 * - Sentiment: 10 points (if positive/negative)
 * - Priority concept bonus: +15 points si concept prioritaire présent
 * - Source quality: implicit (via article count)
 */
function calculateRelevanceScore(item: {
  articleCount?: number;
  concepts?: Array<{ label: string; score: number }>;
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}): number {
  let score = 40; // Base score réduite (plus strict)
  
  // 1. Article count (for events) - diminishing returns
  if (item.articleCount) {
    score += Math.min(30, Math.log(item.articleCount + 1) * 5);
  }
  
  // 2. Concepts score (average of concept scores)
  let hasPriorityConcept = false;
  if (item.concepts && item.concepts.length > 0) {
    const avgConceptScore = item.concepts.reduce((sum, c) => sum + (c.score || 0), 0) / item.concepts.length;
    score += Math.min(30, avgConceptScore * 0.3);
    
    // Bonus si concept prioritaire présent
    hasPriorityConcept = item.concepts.some(c => {
      const label = typeof c.label === 'string' ? c.label : String(c.label || '');
      return PRIORITY_CONCEPTS.some(pc =>
        label.toLowerCase().includes(pc.toLowerCase())
      );
    });
    if (hasPriorityConcept) {
      score += 15; // Bonus pour concepts prioritaires
    }
  }
  
  // 3. Recency (exponential decay: 20 points for now, 0 after 48h)
  const hoursSince = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 20 * Math.exp(-hoursSince / 24));
  
  // 4. Sentiment (extreme = more important)
  if (item.sentiment === 'positive' || item.sentiment === 'negative') {
    score += 10;
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Determine tier based on score
 */
function determineTier(score: number): 'critical' | 'strategic' | 'background' {
  if (score > 90) return 'critical';
  if (score >= 70) return 'strategic';
  return 'background';
}

/**
 * Determine consensus based on source count
 */
function determineConsensus(articleCount: number): 'high' | 'fragmented' | 'disputed' {
  if (articleCount >= 40) return 'high';
  if (articleCount >= 10) return 'fragmented';
  return 'disputed';
}

/**
 * Normalize EventRegistry article to Discover item
 */
function normalizeArticle(article: Article, category: string): DiscoverItemRaw | null {
  if (!article.title || !article.date) {
    return null;
  }
  
  // Normalize concepts to ensure they have label and score
  const concepts = (article.concepts || []).map(c => ({
    label: typeof c.label === 'string' ? c.label : String(c.label || ''),
    score: typeof c.score === 'number' ? c.score : (c.score || 0),
    uri: c.uri || '',
  })).filter(c => c.label); // Filter out concepts without labels
  
  const score = calculateRelevanceScore({
    concepts,
    date: article.date,
    sentiment: article.sentiment?.polarity,
  });
  
  // FILTRE: Vérifier si l'article doit être rejeté
  if (shouldFilterItem(article.title, concepts, score)) {
    return null; // Rejeter
  }
  
  return {
    source: 'eventregistry',
    source_id: article.uri || article.url,
    title: article.title,
    description: article.body?.substring(0, 500) || '',
    content: article.body || '',
    published_at: article.dateTimePub || article.date,
    url: article.url,
    author: article.source?.title,
    language: article.lang || 'en',
    raw_category: category,
    raw_tags: [],
    status: 'pending',
    
    discover_type: 'article',
    discover_category: category,
    discover_tags: concepts.slice(0, 5).map(c => c.label).filter(Boolean),
    discover_thumbnail: article.images?.[0]?.url,
    discover_sources: [{
      name: article.source?.title || 'Unknown',
      url: article.url,
      date: article.date,
    }],
    discover_concepts: concepts.map(c => ({
      uri: c.uri,
      label: c.label,
      score: c.score,
    })),
    discover_location: article.location ? {
      label: article.location.label,
    } : undefined,
    discover_sentiment: article.sentiment?.polarity,
    
    discover_score: score,
    discover_tier: determineTier(score),
    discover_consensus: determineConsensus(1), // Single article = disputed
  };
}

/**
 * Normalize EventRegistry event to Discover item
 */
function normalizeEvent(event: EventRegistryEvent, category: string): DiscoverItemRaw | null {
  if (!event.title || !event.date) {
    return null;
  }
  
  // Normalize concepts to ensure they have label and score
  const concepts = (event.concepts || []).map(c => ({
    label: typeof c.label === 'string' ? c.label : String(c.label || ''),
    score: typeof c.score === 'number' ? c.score : (c.score || 0),
    uri: c.uri || '',
  })).filter(c => c.label); // Filter out concepts without labels
  
  const articleCount = event.articleCount || 0;
  const score = calculateRelevanceScore({
    articleCount,
    concepts,
    date: event.date,
  });
  
  // FILTRE: Vérifier si l'event doit être rejeté
  if (shouldFilterItem(event.title, concepts, score, articleCount)) {
    return null; // Rejeter
  }
  
  // Extract sources from articles
  const sources = event.articles?.slice(0, 10).map(article => ({
    name: article.source?.title || 'Unknown',
    url: article.url,
    date: article.date,
  })) || [];
  
  return {
    source: 'eventregistry',
    source_id: event.uri,
    title: event.title,
    description: event.summary || '',
    content: event.summary || '',
    published_at: event.dateTimePub || event.date,
    url: undefined, // Events don't have a single URL
    author: undefined,
    language: event.lang || 'en',
    raw_category: category,
    raw_tags: [],
    status: 'pending',
    
    discover_type: 'event',
    discover_category: category,
    discover_tags: concepts.slice(0, 5).map(c => c.label).filter(Boolean),
    discover_thumbnail: event.articles?.[0]?.images?.[0]?.url,
    discover_sources: sources,
    discover_concepts: concepts.map(c => ({
      uri: c.uri,
      label: c.label,
      score: c.score,
    })),
    discover_location: event.location ? {
      label: event.location.label,
    } : undefined,
    discover_sentiment: undefined, // Events don't have sentiment directly
    discover_article_count: articleCount,
    
    discover_score: score,
    discover_tier: determineTier(score),
    discover_consensus: determineConsensus(articleCount),
  };
}

/**
 * Normalize EventRegistry trending concept to Discover item
 */
function normalizeTrend(concept: TrendingConcept, category: string): DiscoverItemRaw | null {
  if (!concept.label) {
    return null;
  }
  
  const concepts = [{ label: concept.label, score: concept.score || 0 }];
  const score = calculateRelevanceScore({
    concepts,
    date: new Date().toISOString(), // Trends are current
  });
  
  // FILTRE: Vérifier si le trend doit être rejeté
  if (shouldFilterItem(`Trending: ${concept.label}`, concepts, score, concept.mentionsCount)) {
    return null; // Rejeter
  }
  
  return {
    source: 'eventregistry',
    source_id: concept.uri,
    title: `Trending: ${concept.label}`,
    description: `Trending concept with ${concept.mentionsCount || 0} mentions`,
    content: `Trending concept: ${concept.label}`,
    published_at: new Date().toISOString(),
    url: undefined,
    author: undefined,
    language: 'en',
    raw_category: category,
    raw_tags: [],
    status: 'pending',
    
    discover_type: 'trend',
    discover_category: category,
    discover_tags: [concept.label],
    discover_thumbnail: undefined,
    discover_sources: [],
    discover_concepts: [{
      uri: concept.uri,
      label: concept.label,
      score: concept.score || 0,
    }],
    discover_location: undefined,
    discover_sentiment: undefined,
    discover_article_count: concept.mentionsCount || 0,
    
    discover_score: score,
    discover_tier: determineTier(score),
    discover_consensus: determineConsensus(concept.mentionsCount || 0),
  };
}

/**
 * Enrich event with OpenAI in real-time (generate "Why it matters")
 */
async function enrichEventWithOpenAI(
  eventId: string,
  title: string,
  description: string,
  category: string,
  sources: Array<{ name: string; url: string }>
): Promise<string | null> {
  if (!openaiClient) {
    return null; // Skip if OpenAI not configured
  }

  try {
    const sourcesList = sources.slice(0, 5).map(s => s.name).join(', ');
    
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        {
          role: 'system',
          content: 'Generate a single-line "Why it matters" statement (max 100 chars) for decision-makers. Be concise, focus on impact, not description. Return only the statement, no quotes, no formatting.',
        },
        {
          role: 'user',
          content: `Title: ${title}\nSummary: ${description?.substring(0, 300) || ''}\nCategory: ${category}\nSources: ${sourcesList}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });
    
    const content = response.choices[0]?.message?.content?.trim() || '';
    
    // Ensure it's max 100 chars
    if (content.length > 100) {
      return content.substring(0, 97) + '...';
    }
    
    return content || null;
  } catch (error: any) {
    console.error(`[Discover Collector] OpenAI enrichment error for event ${eventId}:`, error.message);
    return null; // Return null on error (event will be enriched later by batch job)
  }
}

/**
 * Deduplicate items by title + date
 */
function deduplicateItems(items: DiscoverItemRaw[]): DiscoverItemRaw[] {
  const seen = new Map<string, DiscoverItemRaw>();
  
  for (const item of items) {
    const key = `${item.title.toLowerCase()}_${item.published_at.substring(0, 10)}`;
    const existing = seen.get(key);
    
    // Keep the one with higher score
    if (!existing || item.discover_score > existing.discover_score) {
      seen.set(key, item);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Collect Discover items from EventRegistry
 */
export async function collectDiscoverItems(
  categories: string[] = ['all'],
  userPreferences?: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
    focus_areas?: string[];
  }
): Promise<{ collected: number; inserted: number; skipped: number; errors: number; filtered: number }> {
  console.log(`[Discover Collector] Starting collection for categories: ${categories.join(', ')}`);
  if (userPreferences) {
    console.log(`[Discover Collector] Using personalized keywords based on user preferences`);
  }
  
  const allItems: DiscoverItemRaw[] = [];
  let errors = 0;
  let filtered = 0;
  
  try {
    for (const category of categories) {
      // Utiliser keywords personnalisés si disponibles, sinon keywords par défaut
      let keywords = userPreferences 
        ? buildPersonalizedKeywords(userPreferences)
        : mapCategoryToKeywords(category);
      
      // Si pas de keywords personnalisés, utiliser les keywords par défaut
      if (keywords.length === 0) {
        keywords = mapCategoryToKeywords(category);
      }
      
      console.log(`[Discover Collector] Using ${keywords.length} keywords for ${category}`);
      // EventRegistry doesn't support OR syntax - make separate queries for each keyword
      // Add date range (last 7 days) to get recent articles
      const dateEnd = new Date().toISOString().split('T')[0]; // Today
      const dateStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago
      
      console.log(`[Discover Collector] Collecting ${category} (keywords: ${keywords.join(', ')})...`);
      
      try {
        // 1. Articles - query each keyword separately and aggregate
        const allArticles: Article[] = [];
        const articlesPerKeyword = Math.ceil(30 / keywords.length); // Distribute articles across keywords
        
        for (const keyword of keywords) {
          try {
            console.log(`[Discover Collector] Searching articles with keyword: "${keyword}" (${dateStart} to ${dateEnd})`);
            const articlesResponse = await searchArticles({
              keywords: keyword,
              articlesCount: articlesPerKeyword,
              sortBy: 'date',
              sortByAsc: false,
              lang: 'eng',
              dateStart,
              dateEnd,
            });
            
            const articles = articlesResponse.articles?.results || [];
            console.log(`[Discover Collector] Found ${articles.length} articles for "${keyword}"`);
            allArticles.push(...articles);
          } catch (keywordError: any) {
            console.warn(`[Discover Collector] Error searching articles for keyword "${keyword}":`, keywordError.message);
            // Continue with other keywords
          }
        }
        
        console.log(`[Discover Collector] Total articles found for ${category}: ${allArticles.length}`);
        
        for (const article of allArticles) {
          const normalized = normalizeArticle(article, category);
          if (normalized) {
            allItems.push(normalized);
          } else {
            filtered++; // Comptabiliser les articles filtrés
          }
        }
        
        // 2. Events - query each keyword separately and aggregate
        const allEvents: EventRegistryEvent[] = [];
        const eventsPerKeyword = Math.ceil(15 / keywords.length); // Distribute events across keywords
        
        for (const keyword of keywords) {
          try {
            console.log(`[Discover Collector] Searching events with keyword: "${keyword}" (${dateStart} to ${dateEnd})`);
            const eventsResponse = await searchEvents({
              keywords: keyword,
              eventsCount: eventsPerKeyword,
              sortBy: 'date',
              sortByAsc: false,
              lang: 'eng',
              dateStart,
              dateEnd,
            });
            
            const events = eventsResponse.events?.results || [];
            console.log(`[Discover Collector] Found ${events.length} events for "${keyword}"`);
            allEvents.push(...events);
          } catch (keywordError: any) {
            console.warn(`[Discover Collector] Error searching events for keyword "${keyword}":`, keywordError.message);
            // Continue with other keywords
          }
        }
        
        console.log(`[Discover Collector] Total events found for ${category}: ${allEvents.length}`);
        
        for (const event of allEvents) {
          const normalized = normalizeEvent(event, category);
          if (normalized) {
            allItems.push(normalized);
          } else {
            filtered++; // Comptabiliser les events filtrés
          }
        }
        
        // 3. Trends (10 per category, only for 'all')
        if (category === 'all') {
          const trendsResponse = await getTrendingConcepts({
            source: 'news',
            count: 10,
            lang: 'eng',
          });
          
          const trends = trendsResponse.trendingConcepts?.results || [];
          console.log(`[Discover Collector] Found ${trends.length} trends`);
          
          for (const trend of trends) {
            const normalized = normalizeTrend(trend, category);
            if (normalized) {
              allItems.push(normalized);
            } else {
              filtered++; // Comptabiliser les trends filtrés
            }
          }
        }
      } catch (error: any) {
        console.error(`[Discover Collector] Error collecting ${category}:`, error.message);
        errors++;
        // Continue with other categories
      }
    }
    
    // Deduplicate
    const uniqueItems = deduplicateItems(allItems);
    console.log(`[Discover Collector] Collected ${allItems.length} items, ${uniqueItems.length} unique after deduplication`);
    
    // Insert into events table
    let inserted = 0;
    let skipped = 0;
    
    for (const item of uniqueItems) {
      // Check if already exists (by source + source_id)
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', item.source)
        .eq('source_id', item.source_id)
        .maybeSingle();
      
      if (existing) {
        // Update existing event with Discover fields
        const { error: updateError } = await supabase
          .from('events')
          .update({
            discover_score: item.discover_score,
            discover_tier: item.discover_tier,
            discover_consensus: item.discover_consensus,
            discover_type: item.discover_type,
            discover_category: item.discover_category,
            discover_tags: item.discover_tags,
            discover_thumbnail: item.discover_thumbnail,
            discover_sources: item.discover_sources,
            discover_concepts: item.discover_concepts,
            discover_location: item.discover_location,
            discover_sentiment: item.discover_sentiment,
            discover_article_count: item.discover_article_count,
            // Don't update why_it_matters if it already exists (preserve Perplexity enrichment)
          } as any)
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`[Discover Collector] Error updating event: ${updateError.message}`);
          errors++;
        } else {
          skipped++; // Counted as skipped (already existed)
        }
      } else {
        // Insert new event
        const { error: insertError } = await supabase
          .from('events')
          .insert({
            source: item.source,
            source_id: item.source_id,
            title: item.title,
            description: item.description,
            content: item.content,
            published_at: item.published_at,
            url: item.url,
            author: item.author,
            language: item.language,
            raw_category: item.raw_category,
            raw_tags: item.raw_tags,
            status: item.status,
            
            // Discover fields
            discover_score: item.discover_score,
            discover_tier: item.discover_tier,
            discover_consensus: item.discover_consensus,
            discover_type: item.discover_type,
            discover_category: item.discover_category,
            discover_tags: item.discover_tags,
            discover_thumbnail: item.discover_thumbnail,
            discover_sources: item.discover_sources,
            discover_concepts: item.discover_concepts,
            discover_location: item.discover_location,
            discover_sentiment: item.discover_sentiment,
            discover_article_count: item.discover_article_count,
          } as any);
        
        if (insertError) {
          console.error(`[Discover Collector] Error inserting event: ${insertError.message}`);
          console.error(`[Discover Collector] Error details:`, {
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          });
          errors++;
        } else {
          inserted++;
          
          // Enrich with OpenAI in real-time (only for high-scoring items to save costs)
          if (item.discover_score >= 70 && openaiClient) {
            try {
              const whyItMatters = await enrichEventWithOpenAI(
                item.source_id,
                item.title,
                item.description,
                item.discover_category,
                item.discover_sources
              );
              
              if (whyItMatters) {
                // Update event with enrichment
                const { error: updateError } = await supabase
                  .from('events')
                  .update({
                    discover_why_it_matters: whyItMatters,
                    discover_enriched_at: new Date().toISOString(),
                  } as any)
                  .eq('source', item.source)
                  .eq('source_id', item.source_id);
                
                if (updateError) {
                  console.warn(`[Discover Collector] Failed to update enrichment for ${item.source_id}:`, updateError.message);
                } else {
                  console.log(`[Discover Collector] ✅ Enriched event in real-time: ${item.title.substring(0, 50)}...`);
                }
              }
            } catch (enrichError: any) {
              console.warn(`[Discover Collector] Real-time enrichment failed for ${item.source_id}:`, enrichError.message);
              // Don't fail the insertion if enrichment fails
            }
          }
        }
      }
    }
    
    console.log(`[Discover Collector] Collection complete: ${inserted} inserted, ${skipped} updated, ${filtered} filtered, ${errors} errors`);
    
    return {
      collected: uniqueItems.length,
      inserted,
      skipped,
      errors,
      filtered,
    };
  } catch (error: any) {
    console.error('[Discover Collector] Fatal error:', error);
    return {
      collected: allItems.length,
      inserted: 0,
      skipped: 0,
      errors: errors + 1,
      filtered,
    };
  }
}
