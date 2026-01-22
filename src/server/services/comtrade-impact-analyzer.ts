/**
 * Comtrade Impact Analyzer
 * 
 * Analyzes trade flow impacts using UN Comtrade API
 * Validates corporate impact signals with factual trade data
 * 
 * Architecture:
 * - Batch processing only (no runtime frontend calls)
 * - Rules-based calculations (no LLM for numbers)
 * - Stores results in database
 * - Perplexity LIBERATED for source discovery (countries, sectors, HS codes)
 * - LLM only for explanation, not discovery (for final explanation)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

// UN Comtrade API credentials
const COMTRADE_PRIMARY_KEY = process.env.COMTRADE_PRIMARY_KEY || '4845fb8db76c4506b957dacb20ff5ed4';
const COMTRADE_SECONDARY_KEY = process.env.COMTRADE_SECONDARY_KEY || 'b11e0865d9db4dfb8312ac2e18af2351';
const COMTRADE_BASE_URL = 'https://comtradeapi.un.org/data/v1/get';

export interface ComtradeImpactInput {
  event_id: string;
  countries: string[];
  sectors: string[];
  hs_codes?: string[]; // HS codes for products (e.g., "2709" for crude oil)
  event_date: string; // ISO date
  comparison_window?: '1-3 months' | '3-6 months' | '6-12 months';
}

export interface TradeFlowData {
  period: string; // YYYYMM format
  reporterCode: string;
  reporterName: string;
  partnerCode: string;
  partnerName: string;
  flowCode: number; // 1 = imports, 2 = exports
  hsCode: string;
  tradeValue: number; // USD
  tradeQuantity?: number;
  netWeight?: number;
}

export interface TradeImpactMetrics {
  export_drop_percent?: number;
  import_drop_percent?: number;
  export_redirection_percent?: number;
  import_redirection_percent?: number;
  dependency_score?: number; // 0-1, how dependent one country is on another
  concentration_score?: number; // 0-1, how concentrated trade is
  historical_break_score?: number; // 0-1, how much this breaks historical patterns
  [key: string]: any; // Allow additional metrics
}

export interface TradeImpactResult {
  event_id: string;
  trade_impact_score: number; // 0-1
  impact_type: 'Trade Disruption' | 'Trade Reallocation' | 'Supply Chain Risk' | 'Market Opportunity';
  direction: 'Positive' | 'Negative' | 'Mixed';
  confidence: number; // 0-1
  affected_sectors: string[];
  affected_regions: string[];
  time_horizon: 'short' | 'medium' | 'long';
  trade_evidence: Array<{
    metric: string;
    value: string;
    source: 'UN Comtrade';
    description?: string;
  }>;
  hs_codes: string[];
  countries_affected: string[];
  metrics: TradeImpactMetrics;
  last_updated: string;
}

/**
 * Get country code from country name
 */
async function getCountryCode(countryName: string): Promise<string | null> {
  // UN Comtrade country code mapping (simplified - in production, use full mapping)
  const countryMap: Record<string, string> = {
    'Russia': '643',
    'Russian Federation': '643',
    'Germany': '276',
    'United States': '842',
    'USA': '842',
    'China': '156',
    'France': '250',
    'United Kingdom': '826',
    'UK': '826',
    'Italy': '380',
    'Spain': '724',
    'Netherlands': '528',
    'Poland': '616',
    'Belgium': '056',
    'Sweden': '752',
    'Austria': '040',
    'Denmark': '208',
    'Finland': '246',
    'Greece': '300',
    'Portugal': '620',
    'Ireland': '372',
    'Czech Republic': '203',
    'Romania': '642',
    'Hungary': '348',
    'Slovakia': '703',
    'Bulgaria': '100',
    'Croatia': '191',
    'Lithuania': '440',
    'Slovenia': '705',
    'Latvia': '428',
    'Estonia': '233',
    'EU': '97', // European Union aggregate
    'European Union': '97',
  };

  // Try exact match first
  if (countryMap[countryName]) {
    return countryMap[countryName];
  }

  // Try case-insensitive match
  const normalized = countryName.trim();
  for (const [key, code] of Object.entries(countryMap)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return code;
    }
  }

  console.warn(`[Comtrade] Country code not found for: ${countryName}`);
  return null;
}

/**
 * Get HS codes for a sector
 */
function getHSCodesForSector(sector: string): string[] {
  // HS code mapping by sector (simplified - in production, use comprehensive mapping)
  const sectorHSCodes: Record<string, string[]> = {
    'Energy': ['2709', '2710', '2711', '2701', '2704'], // Crude oil, refined products, coal
    'Technology': ['8471', '8517', '8541', '8542'], // Computers, phones, semiconductors
    'Materials': ['2601', '2603', '2604', '2606', '2607'], // Iron ore, copper, nickel
    'Agriculture': ['1001', '1003', '1005', '1201', '1507'], // Wheat, corn, soybeans, palm oil
    'Manufacturing': ['8703', '8704', '8708'], // Vehicles, parts
    'Defense': ['9301', '9302', '9303', '9304'], // Military equipment
    'Chemicals': ['2804', '2901', '2902', '2903'], // Chemical products
    'Pharmaceuticals': ['3004', '3005', '3006'], // Medicines
  };

  // Try exact match
  if (sectorHSCodes[sector]) {
    return sectorHSCodes[sector];
  }

  // Try case-insensitive match
  const normalized = sector.toLowerCase();
  for (const [key, codes] of Object.entries(sectorHSCodes)) {
    if (key.toLowerCase() === normalized) {
      return codes;
    }
  }

  // Default: return empty array (will need manual HS codes)
  return [];
}

/**
 * Fetch trade flow data from UN Comtrade API
 */
async function fetchComtradeData(
  reporterCode: string,
  partnerCode: string,
  hsCode: string,
  period: string, // YYYYMM format
  flowCode: number = 2 // 2 = exports, 1 = imports
): Promise<TradeFlowData[]> {
  try {
    const url = `${COMTRADE_BASE_URL}/${reporterCode}/${period}/all/${hsCode}?type=C&freq=A&px=HS&ps=${period}&r=${reporterCode}&p=${partnerCode}&rg=${flowCode}&cc=AG2&fmt=json&max=5000&head=M&apiKey=${COMTRADE_PRIMARY_KEY}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limit - wait and retry with secondary key
        await new Promise(resolve => setTimeout(resolve, 2000));
        const urlSecondary = url.replace(COMTRADE_PRIMARY_KEY, COMTRADE_SECONDARY_KEY);
        const retryResponse = await fetch(urlSecondary, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Comtrade API error: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        const retryData = await retryResponse.json();
        return parseComtradeResponse(retryData);
      }
      
      throw new Error(`Comtrade API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return parseComtradeResponse(data);
  } catch (error: any) {
    console.error(`[Comtrade] Error fetching data for ${reporterCode}->${partnerCode}, HS${hsCode}:`, error.message);
    throw error;
  }
}

/**
 * Parse UN Comtrade API response
 */
function parseComtradeResponse(data: any): TradeFlowData[] {
  if (!data || !data.data || !Array.isArray(data.data)) {
    return [];
  }

  return data.data.map((item: any) => ({
    period: String(item.period || ''),
    reporterCode: String(item.rgCode || ''),
    reporterName: item.rtTitle || '',
    partnerCode: String(item.ptCode || ''),
    partnerName: item.ptTitle || '',
    flowCode: item.rgCode || 0, // 1 = imports, 2 = exports
    hsCode: String(item.cmdCode || ''),
    tradeValue: parseFloat(item.TradeValue || 0),
    tradeQuantity: item.qty ? parseFloat(item.qty) : undefined,
    netWeight: item.NetWeight ? parseFloat(item.NetWeight) : undefined,
  }));
}

/**
 * Calculate period range for comparison
 */
function calculatePeriodRange(
  eventDate: string,
  comparisonWindow: '1-3 months' | '3-6 months' | '6-12 months' = '3-6 months'
): { before: string[]; after: string[] } {
  const event = new Date(eventDate);
  const before: string[] = [];
  const after: string[] = [];

  // Calculate months before and after
  let beforeMonths = 6;
  let afterMonths = 6;

  if (comparisonWindow === '1-3 months') {
    beforeMonths = 3;
    afterMonths = 3;
  } else if (comparisonWindow === '3-6 months') {
    beforeMonths = 6;
    afterMonths = 6;
  } else if (comparisonWindow === '6-12 months') {
    beforeMonths = 12;
    afterMonths = 12;
  }

  // Generate period strings (YYYYMM format)
  for (let i = beforeMonths; i >= 1; i--) {
    const date = new Date(event);
    date.setMonth(date.getMonth() - i);
    const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    before.push(period);
  }

  for (let i = 1; i <= afterMonths; i++) {
    const date = new Date(event);
    date.setMonth(date.getMonth() + i);
    const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    after.push(period);
  }

  return { before, after };
}

/**
 * Calculate trade impact metrics
 */
function calculateTradeImpactMetrics(
  beforeFlows: TradeFlowData[],
  afterFlows: TradeFlowData[],
  reporterCode: string,
  partnerCode: string
): TradeImpactMetrics {
  const metrics: TradeImpactMetrics = {};

  // Calculate average trade values
  const beforeValue = beforeFlows
    .filter(f => f.reporterCode === reporterCode && f.partnerCode === partnerCode)
    .reduce((sum, f) => sum + f.tradeValue, 0) / Math.max(1, beforeFlows.length);

  const afterValue = afterFlows
    .filter(f => f.reporterCode === reporterCode && f.partnerCode === partnerCode)
    .reduce((sum, f) => sum + f.tradeValue, 0) / Math.max(1, afterFlows.length);

  // Export/Import drop percentage
  if (beforeValue > 0) {
    const dropPercent = ((beforeValue - afterValue) / beforeValue) * 100;
    
    // Determine if exports or imports
    const isExport = beforeFlows.some(f => f.flowCode === 2);
    if (isExport) {
      metrics.export_drop_percent = dropPercent;
    } else {
      metrics.import_drop_percent = dropPercent;
    }
  }

  // Calculate redirection (trade to other partners)
  const totalBefore = beforeFlows.reduce((sum, f) => sum + f.tradeValue, 0);
  const totalAfter = afterFlows.reduce((sum, f) => sum + f.tradeValue, 0);
  const originalPartnerBefore = beforeFlows
    .filter(f => f.partnerCode === partnerCode)
    .reduce((sum, f) => sum + f.tradeValue, 0);
  const originalPartnerAfter = afterFlows
    .filter(f => f.partnerCode === partnerCode)
    .reduce((sum, f) => sum + f.tradeValue, 0);

  if (totalBefore > 0 && totalAfter > 0) {
    const originalPartnerShareBefore = originalPartnerBefore / totalBefore;
    const originalPartnerShareAfter = originalPartnerAfter / totalAfter;
    const redirectionPercent = (originalPartnerShareBefore - originalPartnerShareAfter) * 100;
    
    if (beforeFlows.some(f => f.flowCode === 2)) {
      metrics.export_redirection_percent = redirectionPercent;
    } else {
      metrics.import_redirection_percent = redirectionPercent;
    }
  }

  // Dependency score (how much reporter depends on partner)
  if (totalBefore > 0) {
    metrics.dependency_score = Math.min(1, originalPartnerBefore / totalBefore);
  }

  // Concentration score (how concentrated trade is)
  const partnerShares = beforeFlows.reduce((acc, f) => {
    acc[f.partnerCode] = (acc[f.partnerCode] || 0) + f.tradeValue;
    return acc;
  }, {} as Record<string, number>);
  
  const totalTrade = Object.values(partnerShares).reduce((sum, v) => sum + v, 0);
  if (totalTrade > 0) {
    const maxShare = Math.max(...Object.values(partnerShares)) / totalTrade;
    metrics.concentration_score = maxShare; // Higher = more concentrated
  }

  // Historical break score (simplified - in production, compare with longer historical data)
  if (beforeValue > 0 && afterValue > 0) {
    const changeMagnitude = Math.abs((afterValue - beforeValue) / beforeValue);
    metrics.historical_break_score = Math.min(1, changeMagnitude);
  }

  return metrics;
}

/**
 * Calculate Trade Impact Score (rules-based, no LLM)
 */
function calculateTradeImpactScore(metrics: TradeImpactMetrics): number {
  let score = 0;
  let weights = 0;

  // Export drop weight (0-0.3)
  if (metrics.export_drop_percent !== undefined) {
    const dropMagnitude = Math.min(1, Math.abs(metrics.export_drop_percent) / 50); // 50% drop = max
    score += dropMagnitude * 0.3;
    weights += 0.3;
  }

  // Import drop weight (0-0.3)
  if (metrics.import_drop_percent !== undefined) {
    const dropMagnitude = Math.min(1, Math.abs(metrics.import_drop_percent) / 50);
    score += dropMagnitude * 0.3;
    weights += 0.3;
  }

  // Dependency weight (0-0.2)
  if (metrics.dependency_score !== undefined) {
    score += metrics.dependency_score * 0.2;
    weights += 0.2;
  }

  // Concentration weight (0-0.1)
  if (metrics.concentration_score !== undefined) {
    score += metrics.concentration_score * 0.1;
    weights += 0.1;
  }

  // Redirection weight (0-0.05)
  if (metrics.export_redirection_percent !== undefined) {
    const redirectionMagnitude = Math.min(1, Math.abs(metrics.export_redirection_percent) / 100);
    score += redirectionMagnitude * 0.05;
    weights += 0.05;
  }

  if (metrics.import_redirection_percent !== undefined) {
    const redirectionMagnitude = Math.min(1, Math.abs(metrics.import_redirection_percent) / 100);
    score += redirectionMagnitude * 0.05;
    weights += 0.05;
  }

  // Historical break weight (0-0.1)
  if (metrics.historical_break_score !== undefined) {
    score += metrics.historical_break_score * 0.1;
    weights += 0.1;
  }

  // Normalize by weights
  return weights > 0 ? Math.min(1, score / weights) : 0;
}

/**
 * Determine impact type and direction from metrics
 */
function determineImpactTypeAndDirection(
  metrics: TradeImpactMetrics,
  score: number
): { impact_type: TradeImpactResult['impact_type']; direction: TradeImpactResult['direction'] } {
  let impact_type: TradeImpactResult['impact_type'] = 'Supply Chain Risk';
  let direction: TradeImpactResult['direction'] = 'Negative';

  // High export drop + redirection = Trade Reallocation
  if (
    (metrics.export_drop_percent && Math.abs(metrics.export_drop_percent) > 20) ||
    (metrics.export_redirection_percent && Math.abs(metrics.export_redirection_percent) > 30)
  ) {
    impact_type = 'Trade Reallocation';
  }

  // High import drop = Supply Chain Risk
  if (metrics.import_drop_percent && Math.abs(metrics.import_drop_percent) > 20) {
    impact_type = 'Supply Chain Risk';
  }

  // Very high drop = Trade Disruption
  if (
    (metrics.export_drop_percent && Math.abs(metrics.export_drop_percent) > 50) ||
    (metrics.import_drop_percent && Math.abs(metrics.import_drop_percent) > 50)
  ) {
    impact_type = 'Trade Disruption';
  }

  // Redirection to new markets = Market Opportunity (for some companies)
  if (
    (metrics.export_redirection_percent && metrics.export_redirection_percent > 20) ||
    (metrics.import_redirection_percent && metrics.import_redirection_percent > 20)
  ) {
    impact_type = 'Market Opportunity';
    direction = 'Mixed'; // Opportunity for some, risk for others
  }

  // Determine direction
  if (metrics.export_drop_percent && metrics.export_drop_percent < -10) {
    direction = 'Negative';
  } else if (metrics.import_drop_percent && metrics.import_drop_percent < -10) {
    direction = 'Negative';
  } else if (
    (metrics.export_redirection_percent && metrics.export_redirection_percent > 20) ||
    (metrics.import_redirection_percent && metrics.import_redirection_percent > 20)
  ) {
    direction = 'Mixed';
  }

  return { impact_type, direction };
}

/**
 * Generate trade evidence from metrics
 */
function generateTradeEvidence(metrics: TradeImpactMetrics, hsCode: string, countries: string[]): Array<{
  metric: string;
  value: string;
  source: 'UN Comtrade';
  description?: string;
}> {
  const evidence: Array<{
    metric: string;
    value: string;
    source: 'UN Comtrade';
    description?: string;
  }> = [];

  if (metrics.export_drop_percent !== undefined && Math.abs(metrics.export_drop_percent) > 5) {
    evidence.push({
      metric: 'Export decline',
      value: `${metrics.export_drop_percent > 0 ? '-' : '+'}${Math.abs(metrics.export_drop_percent).toFixed(1)}%`,
      source: 'UN Comtrade',
      description: `Exports of HS${hsCode} from ${countries[0]} to ${countries[1] || 'partners'}`,
    });
  }

  if (metrics.import_drop_percent !== undefined && Math.abs(metrics.import_drop_percent) > 5) {
    evidence.push({
      metric: 'Import decline',
      value: `${metrics.import_drop_percent > 0 ? '-' : '+'}${Math.abs(metrics.import_drop_percent).toFixed(1)}%`,
      source: 'UN Comtrade',
      description: `Imports of HS${hsCode} by ${countries[1] || countries[0]} from ${countries[0]}`,
    });
  }

  if (metrics.export_redirection_percent !== undefined && Math.abs(metrics.export_redirection_percent) > 10) {
    evidence.push({
      metric: 'Trade redirection',
      value: `${Math.abs(metrics.export_redirection_percent).toFixed(1)}%`,
      source: 'UN Comtrade',
      description: `Trade flows redirected to alternative markets`,
    });
  }

  if (metrics.dependency_score !== undefined && metrics.dependency_score > 0.3) {
    evidence.push({
      metric: 'Trade dependency',
      value: `${(metrics.dependency_score * 100).toFixed(0)}%`,
      source: 'UN Comtrade',
      description: `Dependency level between trading partners`,
    });
  }

  return evidence;
}

/**
 * Use Perplexity to discover relevant countries, sectors, and HS codes for an event
 * 
 * Perplexity is LIBERATED here to discover sources, countries, sectors, and HS codes
 */
async function discoverTradeEntitiesWithPerplexity(
  eventTitle: string,
  eventSummary: string,
  existingCountries: string[],
  existingSectors: string[],
  existingHSCodes: string[] = []
): Promise<{
  countries: string[];
  sectors: string[];
  hs_codes: string[];
}> {
  try {
    const { chatCompletions } = await import('./perplexity-service.js');

    const query = `Analyze this geopolitical/regulatory event and identify the key trade entities involved:

Event: ${eventTitle}
${eventSummary ? `Summary: ${eventSummary}` : ''}

${existingCountries.length > 0 ? `Already identified countries: ${existingCountries.join(', ')}` : ''}
${existingSectors.length > 0 ? `Already identified sectors: ${existingSectors.join(', ')}` : ''}

Your task: Find and return ONLY the following information:

1. **Countries involved in trade flows** (exporters/importers affected):
   - List country names (e.g., "Russia", "Germany", "China", "United States")
   - Focus on countries with significant trade relationships affected

2. **Economic sectors impacted**:
   - List sector names (e.g., "Energy", "Technology", "Materials", "Agriculture")
   - Focus on sectors with measurable trade flows

3. **HS codes (Harmonized System codes) for products**:
   - List 2-digit or 4-digit HS codes (e.g., "27" for mineral fuels, "2709" for crude oil, "85" for electrical machinery)
   - Focus on products with significant trade volumes

Return ONLY a JSON object with this structure:
{
  "countries": ["Country1", "Country2", ...],
  "sectors": ["Sector1", "Sector2", ...],
  "hs_codes": ["27", "2709", "85", ...]
}

Do not provide analysis or explanations, only the JSON object.`;

    const response = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a trade data analyst. Your ONLY task is to identify countries, sectors, and HS codes involved in trade flows for geopolitical events. Return ONLY valid JSON, no explanations.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      return_citations: true,
      search_recency_filter: 'month',
      max_tokens: 1000, // Limited - just for discovery
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Try to parse JSON from response
    let discovered: {
      countries: string[];
      sectors: string[];
      hs_codes: string[];
    } = {
      countries: [],
      sectors: [],
      hs_codes: [],
    };

    try {
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        discovered = JSON.parse(jsonMatch[0]);
      }
    } catch (error: any) {
      console.warn('[Comtrade] Failed to parse Perplexity discovery response:', error.message);
      // Fallback: try to extract from text
      const countryMatches = content.matchAll(/(?:country|countries)[:\-]?\s*\[?([^\]]+)\]?/gi);
      const sectorMatches = content.matchAll(/(?:sector|sectors)[:\-]?\s*\[?([^\]]+)\]?/gi);
      const hsMatches = content.matchAll(/(?:hs[_\s]?code|hs[_\s]?codes)[:\-]?\s*\[?([^\]]+)\]?/gi);
      
      for (const match of countryMatches) {
        const countries = match[1].split(',').map(c => c.trim().replace(/["']/g, ''));
        discovered.countries.push(...countries);
      }
      
      for (const match of sectorMatches) {
        const sectors = match[1].split(',').map(s => s.trim().replace(/["']/g, ''));
        discovered.sectors.push(...sectors);
      }
      
      for (const match of hsMatches) {
        const codes = match[1].split(',').map(c => c.trim().replace(/["']/g, ''));
        discovered.hs_codes.push(...codes);
      }
    }

    // Merge with existing data (deduplicate)
    const allCountries = [...new Set([...existingCountries, ...discovered.countries])];
    const allSectors = [...new Set([...existingSectors, ...discovered.sectors])];
    const allHSCodes = [...new Set([...existingHSCodes, ...discovered.hs_codes])];

    console.log(`[Comtrade] Perplexity discovered: ${discovered.countries.length} countries, ${discovered.sectors.length} sectors, ${discovered.hs_codes.length} HS codes`);

    return {
      countries: allCountries,
      sectors: allSectors,
      hs_codes: allHSCodes,
    };
  } catch (error: any) {
    console.warn('[Comtrade] Perplexity discovery failed (non-blocking):', error.message);
    // Return existing data if discovery fails
    return {
      countries: existingCountries,
      sectors: existingSectors,
      hs_codes: existingHSCodes,
    };
  }
}

/**
 * Main function: Analyze trade impact for an event
 */
export async function analyzeTradeImpact(
  input: ComtradeImpactInput
): Promise<TradeImpactResult | null> {
  try {
    console.log(`[Comtrade] Analyzing trade impact for event ${input.event_id}`);

    // STEP 0: Use Perplexity to discover relevant trade entities (if event data available)
    let enrichedInput = input;
    try {
      // Try to get event data for Perplexity discovery
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: event } = await supabase
          .from('events')
          .select('title, description, content')
          .eq('id', input.event_id)
          .single();

        if (event) {
          console.log(`[Comtrade] Using Perplexity to discover trade entities for event ${input.event_id}`);
          const discovered = await discoverTradeEntitiesWithPerplexity(
            event.title || '',
            event.description || event.content || '',
            input.countries,
            input.sectors,
            input.hs_codes || []
          );

          enrichedInput = {
            ...input,
            countries: discovered.countries,
            sectors: discovered.sectors,
            hs_codes: discovered.hs_codes.length > 0 ? discovered.hs_codes : input.hs_codes,
          };

          console.log(`[Comtrade] Enriched input: ${enrichedInput.countries.length} countries, ${enrichedInput.sectors.length} sectors, ${enrichedInput.hs_codes?.length || 0} HS codes`);
        }
      }
    } catch (error: any) {
      console.warn('[Comtrade] Perplexity discovery failed (non-blocking), using original input:', error.message);
    }

    // Step 1: Resolve country codes
    const countryCodes: string[] = [];
    for (const country of enrichedInput.countries) {
      const code = await getCountryCode(country);
      if (code) {
        countryCodes.push(code);
      }
    }

    if (countryCodes.length < 2) {
      console.warn(`[Comtrade] Need at least 2 valid country codes, got ${countryCodes.length}`);
      return null;
    }

    // Step 2: Get HS codes
    let hsCodes = enrichedInput.hs_codes || [];
    if (hsCodes.length === 0) {
      // Try to get from sectors
      for (const sector of enrichedInput.sectors) {
        const sectorCodes = getHSCodesForSector(sector);
        hsCodes.push(...sectorCodes);
      }
    }

    if (hsCodes.length === 0) {
      console.warn(`[Comtrade] No HS codes available for sectors: ${enrichedInput.sectors.join(', ')}`);
      return null;
    }

    // Step 3: Calculate period ranges
    const comparisonWindow = input.comparison_window || '3-6 months';
    const { before, after } = calculatePeriodRange(input.event_date, comparisonWindow);

    // Step 4: Fetch trade data (before and after)
    const reporterCode = countryCodes[0];
    const partnerCode = countryCodes[1];

    const beforeFlows: TradeFlowData[] = [];
    const afterFlows: TradeFlowData[] = [];

    // Fetch data for each HS code and period
    for (const hsCode of hsCodes.slice(0, 3)) { // Limit to 3 HS codes to avoid rate limits
      for (const period of before) {
        try {
          const flows = await fetchComtradeData(reporterCode, partnerCode, hsCode, period, 2); // Exports
          beforeFlows.push(...flows);
          
          // Also fetch imports
          const importFlows = await fetchComtradeData(reporterCode, partnerCode, hsCode, period, 1);
          beforeFlows.push(...importFlows);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.warn(`[Comtrade] Failed to fetch data for HS${hsCode}, period ${period}:`, error.message);
        }
      }

      for (const period of after) {
        try {
          const flows = await fetchComtradeData(reporterCode, partnerCode, hsCode, period, 2); // Exports
          afterFlows.push(...flows);
          
          const importFlows = await fetchComtradeData(reporterCode, partnerCode, hsCode, period, 1);
          afterFlows.push(...importFlows);
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.warn(`[Comtrade] Failed to fetch data for HS${hsCode}, period ${period}:`, error.message);
        }
      }
    }

    if (beforeFlows.length === 0 && afterFlows.length === 0) {
      console.warn(`[Comtrade] No trade data found for event ${input.event_id}`);
      return null;
    }

    // Step 5: Calculate metrics
    const metrics = calculateTradeImpactMetrics(beforeFlows, afterFlows, reporterCode, partnerCode);

    // Step 6: Calculate trade impact score
    const tradeImpactScore = calculateTradeImpactScore(metrics);

    // Step 7: Determine impact type and direction
    const { impact_type, direction } = determineImpactTypeAndDirection(metrics, tradeImpactScore);

    // Step 8: Generate evidence
    const tradeEvidence = generateTradeEvidence(metrics, hsCodes[0], input.countries);

    // Step 9: Determine confidence (based on data quality and score magnitude)
    let confidence = tradeImpactScore;
    if (beforeFlows.length < 3 || afterFlows.length < 3) {
      confidence *= 0.7; // Lower confidence if limited data
    }
    if (tradeEvidence.length === 0) {
      confidence *= 0.5; // Much lower if no evidence
    }

    // Step 10: Determine time horizon
    let time_horizon: 'short' | 'medium' | 'long' = 'medium';
    if (comparisonWindow === '1-3 months') {
      time_horizon = 'short';
    } else if (comparisonWindow === '6-12 months') {
      time_horizon = 'long';
    }

    const result: TradeImpactResult = {
      event_id: input.event_id,
      trade_impact_score: tradeImpactScore,
      impact_type,
      direction,
      confidence: Math.min(1, confidence),
      affected_sectors: input.sectors,
      affected_regions: input.countries,
      time_horizon,
      trade_evidence: tradeEvidence,
      hs_codes: hsCodes,
      countries_affected: enrichedInput.countries,
      metrics,
      last_updated: new Date().toISOString(),
    };

    console.log(`[Comtrade] Trade impact analysis complete: score=${tradeImpactScore.toFixed(2)}, type=${impact_type}, direction=${direction}`);

    return result;
  } catch (error: any) {
    console.error(`[Comtrade] Error analyzing trade impact for event ${input.event_id}:`, error);
    return null;
  }
}

/**
 * Batch analyze trade impacts for multiple events
 */
export async function batchAnalyzeTradeImpacts(
  inputs: ComtradeImpactInput[]
): Promise<Array<{ input: ComtradeImpactInput; result: TradeImpactResult | null }>> {
  const results: Array<{ input: ComtradeImpactInput; result: TradeImpactResult | null }> = [];

  for (const input of inputs) {
    try {
      const result = await analyzeTradeImpact(input);
      results.push({ input, result });
      
      // Rate limiting between events
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`[Comtrade] Error in batch analysis for event ${input.event_id}:`, error);
      results.push({ input, result: null });
    }
  }

  return results;
}

/**
 * Store trade impact data in database
 */
export async function storeTradeImpactData(
  eventId: string,
  tradeImpact: TradeImpactResult,
  explanation?: string
): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[Comtrade] Supabase not configured, skipping storage');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('trade_impact')
      .upsert({
        event_id: eventId,
        trade_impact_score: tradeImpact.trade_impact_score,
        impact_type: tradeImpact.impact_type,
        direction: tradeImpact.direction,
        confidence: tradeImpact.confidence,
        affected_sectors: tradeImpact.affected_sectors,
        affected_regions: tradeImpact.affected_regions,
        countries_affected: tradeImpact.countries_affected,
        hs_codes: tradeImpact.hs_codes,
        time_horizon: tradeImpact.time_horizon,
        trade_evidence: tradeImpact.trade_evidence,
        metrics: tradeImpact.metrics,
        last_updated: tradeImpact.last_updated,
      }, {
        onConflict: 'event_id',
      });

    if (error) {
      console.error('[Comtrade] Error storing trade impact data:', error);
      return false;
    }

    console.log(`[Comtrade] Stored trade impact data for event ${eventId}`);
    return true;
  } catch (error: any) {
    console.error('[Comtrade] Error storing trade impact data:', error);
    return false;
  }
}

/**
 * Generate LLM explanation for trade impact (explain only, no discovery)
 */
export async function generateTradeImpactExplanation(
  tradeImpact: TradeImpactResult,
  eventTitle: string,
  eventSummary: string
): Promise<string> {
  try {
    const { default: OpenAI } = await import('openai');
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return `Trade impact validated: ${tradeImpact.impact_type} (${tradeImpact.direction}) with ${(tradeImpact.confidence * 100).toFixed(0)}% confidence.`;
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const prompt = `Explain the trade impact analysis results. DO NOT discover or calculate anything - only explain what the data shows.

Event: ${eventTitle}
${eventSummary ? `Summary: ${eventSummary}` : ''}

Trade Impact Analysis Results:
- Impact Type: ${tradeImpact.impact_type}
- Direction: ${tradeImpact.direction}
- Confidence: ${(tradeImpact.confidence * 100).toFixed(0)}%
- Trade Impact Score: ${(tradeImpact.trade_impact_score * 100).toFixed(0)}%

Trade Evidence:
${tradeImpact.trade_evidence.map(e => `- ${e.metric}: ${e.value}${e.description ? ` (${e.description})` : ''}`).join('\n')}

Metrics:
${tradeImpact.metrics?.export_drop_percent !== undefined ? `- Export drop: ${tradeImpact.metrics.export_drop_percent.toFixed(1)}%` : ''}
${tradeImpact.metrics?.import_drop_percent !== undefined ? `- Import drop: ${tradeImpact.metrics.import_drop_percent.toFixed(1)}%` : ''}
${tradeImpact.metrics?.dependency_score !== undefined ? `- Dependency: ${(tradeImpact.metrics.dependency_score * 100).toFixed(0)}%` : ''}

Your task: Explain what these trade data indicate for companies and sectors. Connect the trade disruption/reallocation to corporate impact. Use factual language based on the data provided. Do not make up numbers or predictions.

Format: 2-3 sentences explaining the corporate implications.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a trade and economic analyst. Your ONLY task is to explain trade data and connect it to corporate impact. You do NOT discover, calculate, or predict - only explain what the data shows.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('[Comtrade] Error generating explanation:', error);
    return `Trade impact validated: ${tradeImpact.impact_type} (${tradeImpact.direction}).`;
  }
}

/**
 * Get trade impact data for an event
 */
export async function getTradeImpactData(eventId: string): Promise<TradeImpactResult | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('trade_impact')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      event_id: data.event_id,
      trade_impact_score: parseFloat(data.trade_impact_score),
      impact_type: data.impact_type as TradeImpactResult['impact_type'],
      direction: data.direction as TradeImpactResult['direction'],
      confidence: parseFloat(data.confidence),
      affected_sectors: data.affected_sectors || [],
      affected_regions: data.affected_regions || [],
      time_horizon: data.time_horizon as TradeImpactResult['time_horizon'],
      trade_evidence: data.trade_evidence || [],
      hs_codes: data.hs_codes || [],
      countries_affected: data.countries_affected || [],
      metrics: data.metrics || {},
      last_updated: data.last_updated,
    };
  } catch (error: any) {
    console.error('[Comtrade] Error getting trade impact data:', error);
    return null;
  }
}
