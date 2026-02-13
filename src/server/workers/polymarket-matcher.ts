/**
 * Polymarket Matcher Worker
 *
 * Matches Nucigen PressureSignals to Polymarket prediction markets
 * using keyword overlap. No LLM calls — pure text matching.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Stopwords to exclude from keyword extraction
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both',
  'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
  'too', 'very', 'just', 'because', 'that', 'this', 'these', 'those',
  'it', 'its', 'he', 'she', 'they', 'them', 'their', 'we', 'us', 'our',
  'also', 'about', 'over', 'under', 'up', 'out', 'if', 'then',
  'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
  'effect', 'changes', 'markets', 'less', 'before', 'after', 'between',
]);

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Calculate relevance score between a signal and a market.
 * question matches count double vs tag matches to avoid spurious tag-only matches.
 * Requires at least 1 keyword match in the question itself.
 */
function matchScore(
  signalKeywords: string[],
  questionText: string,
  tagsText: string
): number {
  const questionWords = extractKeywords(questionText);
  const tagWords = extractKeywords(tagsText);
  if (questionWords.length === 0 || signalKeywords.length === 0) return 0;

  const signalSet = new Set(signalKeywords);

  let questionMatches = 0;
  for (const word of questionWords) {
    if (signalSet.has(word)) questionMatches++;
  }

  // Require at least 1 match in the actual question (not just tags)
  if (questionMatches < 1) return 0;

  let tagMatches = 0;
  for (const word of tagWords) {
    if (signalSet.has(word)) tagMatches++;
  }

  // Weighted score: question matches count 2x, tag matches count 1x
  const totalWeight = questionWords.length * 2 + tagWords.length;
  const weightedMatches = questionMatches * 2 + tagMatches;

  // At least 2 total keyword matches
  if (questionMatches + tagMatches < 2) return 0;

  return weightedMatches / totalWeight;
}

interface SignalForMatching {
  id: string;
  title: string;
  summary: string;
  pressure: {
    system: string;
    pressure_vector: string;
    probability_estimate: number;
    transmission_channels: string[];
    exposed_entities: string[];
  };
}

interface MatchResult {
  signal_id: string;
  market_id: string;
  match_score: number;
  model_probability: number;
  crowd_probability: number;
  divergence: number;
}

/**
 * Match a set of pressure signals against all Polymarket markets
 */
export async function matchSignalsToMarkets(
  signals: SignalForMatching[]
): Promise<{ matched: number; errors: number }> {
  console.log(`[Polymarket Matcher] Matching ${signals.length} signals against Polymarket markets...`);

  // Fetch all active markets from DB (include tags for better matching)
  const { data: markets, error: fetchErr } = await supabase
    .from('polymarket_markets')
    .select('id, condition_id, question, outcome_yes_price, volume, url, event_title, tags')
    .gt('volume', 1000)  // Only markets with meaningful volume
    .order('volume', { ascending: false })
    .limit(500);

  if (fetchErr || !markets) {
    console.error('[Polymarket Matcher] Failed to fetch markets:', fetchErr?.message);
    return { matched: 0, errors: 1 };
  }

  console.log(`[Polymarket Matcher] ${markets.length} active markets in DB`);

  const matches: MatchResult[] = [];

  for (const signal of signals) {
    // Build keyword set from signal
    const keywords = [
      ...extractKeywords(signal.title),
      ...extractKeywords(signal.summary),
      ...extractKeywords(signal.pressure.pressure_vector.replace(/_/g, ' ')),
      ...signal.pressure.transmission_channels.flatMap(ch => extractKeywords(ch)),
      ...signal.pressure.exposed_entities.flatMap(e => extractKeywords(e)),
    ];

    // Deduplicate
    const uniqueKeywords = [...new Set(keywords)];

    if (uniqueKeywords.length < 2) continue;

    // Find best matching market
    let bestMatch: { market: typeof markets[0]; score: number } | null = null;

    for (const market of markets) {
      const questionText = `${market.question} ${market.event_title || ''}`;
      const tagsText = (market.tags || []).join(' ');
      const score = matchScore(uniqueKeywords, questionText, tagsText);

      if (score >= 0.08 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { market, score };
      }
    }

    if (bestMatch) {
      const crowdProb = Number(bestMatch.market.outcome_yes_price) || 0.5;
      const modelProb = signal.pressure.probability_estimate;

      matches.push({
        signal_id: signal.id,
        market_id: bestMatch.market.id,
        match_score: Math.round(bestMatch.score * 1000) / 1000,
        model_probability: modelProb,
        crowd_probability: crowdProb,
        divergence: Math.round((crowdProb - modelProb) * 10000) / 10000,
      });
    }
  }

  console.log(`[Polymarket Matcher] Found ${matches.length} signal-market matches`);

  let errors = 0;

  // Clear old matches for these signals and insert new ones
  if (matches.length > 0) {
    const signalIds = matches.map(m => m.signal_id);

    // Delete stale matches
    await supabase
      .from('signal_market_matches')
      .delete()
      .in('signal_id', signalIds);

    // Insert fresh matches in batches
    for (let i = 0; i < matches.length; i += 50) {
      const batch = matches.slice(i, i + 50).map(m => ({
        signal_id: m.signal_id,
        market_id: m.market_id,
        match_score: m.match_score,
        model_probability: m.model_probability,
        crowd_probability: m.crowd_probability,
        divergence: m.divergence,
        matched_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('signal_market_matches')
        .insert(batch);

      if (error) {
        console.error('[Polymarket Matcher] Insert error:', error.message);
        errors++;
      }
    }
  }

  // Log top divergences
  const topDivergences = matches
    .sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence))
    .slice(0, 5);

  for (const m of topDivergences) {
    console.log(
      `[Polymarket Matcher] Divergence: model=${(m.model_probability * 100).toFixed(0)}% vs crowd=${(m.crowd_probability * 100).toFixed(0)}% (Δ${(m.divergence * 100).toFixed(0)}%) [score=${m.match_score}]`
    );
  }

  return { matched: matches.length, errors };
}

/**
 * Run if called directly (requires signals passed in)
 */
export async function runPolymarketMatcher() {
  console.log('='.repeat(60));
  console.log('POLYMARKET MATCHER');
  console.log('='.repeat(60));
  console.log('[Polymarket Matcher] This worker is called from the cron endpoint with signals from cache.');
  console.log('='.repeat(60));
}

if (process.argv[1] && process.argv[1].includes('polymarket-matcher')) {
  runPolymarketMatcher()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
