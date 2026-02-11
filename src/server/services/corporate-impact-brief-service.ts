/**
 * Corporate Impact Brief Service
 * Generates mini or pro impact briefs for given tickers using existing signals and event analyses.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const OPENAI_MODEL = 'gpt-4o-mini';

export type BriefType = 'mini' | 'pro';

export interface BriefResult {
  brief: string;
  briefType: BriefType;
  scope: 'tickers' | 'sectors';
  signalsUsed: Array<{ id: string; company_name: string; type: string; event_title: string }>;
  generated_at: string;
  industries?: string[];
}

/**
 * Fetch active market signals for the given tickers (match by company_ticker or company_name).
 */
export async function getSignalsForTickers(
  supabase: SupabaseClient,
  tickers: string[]
): Promise<any[]> {
  if (tickers.length === 0) return [];
  const normalized = tickers.map((t) => t.trim().toUpperCase()).filter(Boolean);
  if (normalized.length === 0) return [];

  const { data, error } = await supabase
    .from('market_signals')
    .select('*')
    .eq('is_active', true)
    .in('company_ticker', normalized)
    .order('generated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('[Corporate Impact Brief] getSignalsForTickers error:', error.message);
    return [];
  }

  const byTicker = (data || []).filter((s: any) => s.company_ticker && normalized.includes(String(s.company_ticker).toUpperCase()));
  if (byTicker.length >= 5) return byTicker;

  // Also fetch by company_name ilike for tickers that might be stored as name
  const { data: byName } = await supabase
    .from('market_signals')
    .select('*')
    .eq('is_active', true)
    .order('generated_at', { ascending: false })
    .limit(100);

  const namesLower = normalized.map((t) => t.toLowerCase());
  const matched = (byName || []).filter((s: any) => {
    const ticker = (s.company_ticker || '').toUpperCase();
    const name = (s.company_name || '').toLowerCase();
    if (normalized.includes(ticker)) return true;
    return namesLower.some((n) => name.includes(n) || name === n);
  });

  const seen = new Set(byTicker.map((s: any) => s.id));
  for (const s of matched) {
    if (!seen.has(s.id)) {
      byTicker.push(s);
      seen.add(s.id);
    }
  }
  return byTicker.slice(0, 50);
}

/**
 * Fetch active market signals for the given industries (company_sector).
 */
export async function getSignalsForIndustries(
  supabase: SupabaseClient,
  industries: string[]
): Promise<any[]> {
  if (industries.length === 0) return [];
  const normalized = industries.map((s) => s.trim()).filter(Boolean);
  if (normalized.length === 0) return [];

  const { data, error } = await supabase
    .from('market_signals')
    .select('*')
    .eq('is_active', true)
    .in('company_sector', normalized)
    .order('generated_at', { ascending: false })
    .limit(80);

  if (error) {
    console.warn('[Corporate Impact Brief] getSignalsForIndustries error:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Fetch event_impact_analyses for the given event IDs.
 */
export async function getEventAnalysesForEventIds(
  supabase: SupabaseClient,
  eventIds: string[]
): Promise<any[]> {
  if (eventIds.length === 0) return [];
  const uniq = [...new Set(eventIds)];

  const { data, error } = await supabase
    .from('event_impact_analyses')
    .select('*')
    .in('event_id', uniq);

  if (error) {
    console.warn('[Corporate Impact Brief] getEventAnalyses error:', error.message);
    return [];
  }
  return data || [];
}

function buildContextFromSignalsAndAnalyses(signals: any[], analyses: any[]): string {
  const analysisByEvent: Record<string, any> = {};
  for (const a of analyses) {
    analysisByEvent[a.event_id] = a;
  }

  const signalBlocks = signals.slice(0, 30).map((s) => {
    const a = s.event_id ? analysisByEvent[s.event_id] : null;
    const price = s.company_current_price && !String(s.company_current_price).includes('Not available')
      ? s.company_current_price : null;
    const mktData = typeof s.market_data === 'object' && s.market_data?.current_price
      ? s.market_data : null;

    return `
[Signal] ${s.company_name} (${s.company_ticker || 'N/A'}) — ${s.type}
  ${price ? `Price: ${price}` : ''}${mktData ? ` | Change: ${mktData.change_percent?.toFixed(2)}%` : ''}
  Event: ${s.catalyst_event_title || 'N/A'}
  Direction: ${s.prediction_direction} | Magnitude: ${s.prediction_magnitude || 'N/A'} | Timeframe: ${s.prediction_timeframe || 'N/A'}
  Confidence: ${s.prediction_confidence || 'N/A'}
  Summary: ${(s.reasoning_summary || '').slice(0, 400)}
  Key factors: ${Array.isArray(s.reasoning_key_factors) ? s.reasoning_key_factors.slice(0, 4).join('; ') : 'N/A'}
${a ? `  [Event analysis] Type: ${a.event_type} | Scope: ${a.event_scope} | Impact score: ${a.impact_score ?? 'N/A'}
  Causal chain: ${Array.isArray(a.causal_chain) ? a.causal_chain.slice(0, 3).join(' → ') : 'N/A'}` : ''}
`;
  });

  return signalBlocks.join('\n');
}

const MINI_SYSTEM = `You are a corporate impact analyst. Produce a short, actionable impact brief. Use only the provided signal and event data. Do not invent data. Do not give buy/sell recommendations. Output plain text (no markdown).`;

const MINI_USER_TEMPLATE = `Based on the following market signals and event analyses for the requested companies, write a MINI impact brief (about 150–250 words) with:

1. One short paragraph: what changed (main drivers and events affecting these companies).
2. Top 2–3 events that matter most for the selected tickers.
3. Three concrete decision points: "Consider: [Hold / Hedge / Accumulate / Exit] — [reason in one sentence]."

Use only the data below. If there is no data for a ticker, say "No recent signals for [TICKER]."

Data:
{{context}}`;

const MINI_SECTOR_USER_TEMPLATE = `Based on the following market signals and event analyses for companies in the selected sectors, write a MINI sector impact brief (about 150–250 words) with:

1. One short paragraph: what changed (main drivers and events affecting these sectors).
2. Top 2–3 events that matter most across the sectors.
3. Three concrete decision points: "Consider: [Hold / Hedge / Accumulate / Exit] — [reason in one sentence]."

Use only the data below. Focus on sector-level pressure and exposure.

Data:
{{context}}`;

const PRO_SYSTEM = `You are a corporate impact analyst. Produce a detailed, board-ready impact brief. Use only the provided signal and event data. Do not invent data. Do not give buy/sell recommendations. Output plain text with clear sections (no markdown headers).`;

const PRO_USER_TEMPLATE = `Based on the following market signals and event analyses for the requested companies, write a PRO impact brief (about 400–600 words) with:

1. Stock overview: 2 short paragraphs on recent event-driven pressure and how it affects the selected companies (exposure channels, causal links).
2. Key insights: 5–8 bullet-style findings (figures, sectors, risk types) from the data.
3. Current pressure: Summary of causal chains and exposure channels from the event analyses.
4. Risk assessment: Main risks and confidence levels from the data.
5. Scenario outlook: Short bull/base/bear-style implications (what could happen next) based on the causal chains—no price targets.
6. Final recommendation: One paragraph conservative summary (Neutral/Hold stance), key catalysts and what to watch. No explicit buy/sell.

Use only the data below. If there is little data, say so and summarize what is available.

Data:
{{context}}`;

const PRO_SECTOR_USER_TEMPLATE = `Based on the following market signals and event analyses for companies in the selected sectors, write a PRO sector impact brief (about 400–600 words) with:

1. Sector overview: 2 short paragraphs on recent event-driven pressure across these sectors (exposure channels, causal links).
2. Key insights: 5–8 bullet-style findings (figures, sectors, risk types) from the data.
3. Current pressure: Summary of causal chains and exposure channels from the event analyses.
4. Risk assessment: Main risks and confidence levels from the data.
5. Scenario outlook: Short bull/base/bear-style implications. No price targets.
6. Final recommendation: One paragraph conservative summary (Neutral/Hold), key catalysts and what to watch. No explicit buy/sell.

Use only the data below. Focus on sector-level analysis.

Data:
{{context}}`;

/**
 * Generate a mini or pro brief from context using OpenAI.
 */
export async function generateBriefFromContext(
  context: string,
  briefType: BriefType,
  scope: 'tickers' | 'sectors',
  scopeLabel: string
): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required for brief generation');
  }
  const openai = new OpenAI({ apiKey: openaiApiKey });

  const systemPrompt = briefType === 'mini' ? MINI_SYSTEM : PRO_SYSTEM;
  const template =
    scope === 'sectors'
      ? (briefType === 'mini' ? MINI_SECTOR_USER_TEMPLATE : PRO_SECTOR_USER_TEMPLATE)
      : (briefType === 'mini' ? MINI_USER_TEMPLATE : PRO_USER_TEMPLATE);
  const userPrompt = template.replace(
    '{{context}}',
    context || `No signals or event analyses available for ${scopeLabel}.`
  );

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: briefType === 'mini' ? 600 : 1200,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }
  return content.trim();
}

/**
 * Generate an impact brief for the given tickers and/or industries and brief type.
 */
export async function generateImpactBrief(
  supabase: SupabaseClient,
  tickers: string[],
  briefType: BriefType,
  industries?: string[]
): Promise<BriefResult> {
  let signals: any[] = [];
  let scope: 'tickers' | 'sectors' = 'tickers';
  let scopeLabel = tickers.length ? tickers.join(', ') : '';

  if (industries && industries.length > 0) {
    signals = await getSignalsForIndustries(supabase, industries);
    scope = 'sectors';
    scopeLabel = industries.join(', ');
    if (tickers.length > 0) {
      const byTicker = await getSignalsForTickers(supabase, tickers);
      const seen = new Set(signals.map((s: any) => s.id));
      for (const s of byTicker) {
        if (!seen.has(s.id)) {
          signals.push(s);
          seen.add(s.id);
        }
      }
      signals = signals.slice(0, 50);
    }
  } else {
    signals = await getSignalsForTickers(supabase, tickers);
  }

  const eventIds = [...new Set((signals || []).map((s: any) => s.event_id).filter(Boolean))];
  const analyses = await getEventAnalysesForEventIds(supabase, eventIds);
  const context = buildContextFromSignalsAndAnalyses(signals, analyses);

  const brief = await generateBriefFromContext(context, briefType, scope, scopeLabel);

  const signalsUsed = signals.slice(0, 25).map((s: any) => ({
    id: s.id,
    company_name: s.company_name || 'Unknown',
    type: s.type || 'unknown',
    event_title: s.catalyst_event_title || 'Unknown event',
  }));

  const result: BriefResult = {
    brief,
    briefType,
    scope,
    signalsUsed,
    generated_at: new Date().toISOString(),
  };
  if (industries && industries.length > 0) {
    result.industries = industries;
  }
  return result;
}
