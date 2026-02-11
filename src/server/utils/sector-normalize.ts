/**
 * Sector normalization utility for Corporate Impact
 * Deduplicates semantic variants into canonical sector names.
 * Uses exact map first, then keyword-based fallback for Perplexity's creative formats.
 */

const SECTOR_NORMALIZE_MAP: Record<string, string> = {
  'semiconductors/technology': 'Technology',
  'semiconductors': 'Technology',
  'defense/aerospace': 'Aerospace & Defense',
  'defense': 'Aerospace & Defense',
  'aerospace': 'Aerospace & Defense',
  'aerospace & defense': 'Aerospace & Defense',
  'defense & aerospace': 'Aerospace & Defense',
  'defense & weapons': 'Aerospace & Defense',
  'defense & vehicles': 'Aerospace & Defense',
  'satellite communications': 'Aerospace & Defense',
  'mining & mineral exploration': 'Mining',
  'mining & rare earth elements': 'Mining',
  'mining & molybdenum': 'Mining',
  'mining & titanium': 'Mining',
  'mining': 'Mining',
  'fishing & seafood': 'Agriculture',
  'agriculture': 'Agriculture',
  'shipping & logistics': 'Logistics',
  'transportation & logistics': 'Logistics',
  'transportation': 'Logistics',
  'transportation (railroads)': 'Logistics',
  'airlines': 'Logistics',
  'industrials (airlines)': 'Logistics',
  'luxury goods': 'Consumer Goods',
  'consumer goods': 'Consumer Goods',
  'consumer staples': 'Consumer Goods',
  'consumer discretionary': 'Consumer Goods',
  'consumer discretionary (hotels & travel)': 'Consumer Goods',
  'consumer discretionary (travel services)': 'Consumer Goods',
  'financial services': 'Financials',
  'financials': 'Financials',
  'utilities': 'Utilities',
  'energy & utilities': 'Energy',
  'materials': 'Materials',
  'manufacturing': 'Industrials',
  'automotive': 'Automotive',
  'energy': 'Energy',
  'energy (oilfield services)': 'Energy',
  'renewable energy': 'Energy',
  'renewables': 'Energy',
  'machinery': 'Industrials',
  'industrials': 'Industrials',
  'industrials (cryogenic equipment)': 'Industrials',
  'technology': 'Technology',
  'technology (software)': 'Technology',
  'technology (cybersecurity)': 'Technology',
  'technology & surveillance': 'Technology',
  'cloud computing & technology': 'Technology',
  'data analytics & ai': 'Technology',
  'cybersecurity': 'Technology',
  'software': 'Technology',
  'networking': 'Technology',
  'healthcare': 'Healthcare',
  'healthcare (pharmaceuticals)': 'Healthcare',
  'healthcare (medical devices)': 'Healthcare',
  'healthcare (life sciences instruments)': 'Healthcare',
  'communication services': 'Communication Services',
  'communication services (entertainment)': 'Communication Services',
  'media': 'Communication Services',
};

/** Keyword → canonical sector fallback when exact match fails */
const KEYWORD_FALLBACK: Array<[string[], string]> = [
  [['defense', 'weapon', 'military', 'aerospace'], 'Aerospace & Defense'],
  [['tech', 'software', 'cyber', 'cloud', 'ai', 'semiconductor', 'chip'], 'Technology'],
  [['health', 'pharma', 'medical', 'biotech', 'life science'], 'Healthcare'],
  [['energy', 'oil', 'gas', 'renewable', 'solar', 'wind', 'nuclear'], 'Energy'],
  [['transport', 'airline', 'railroad', 'shipping', 'logistic', 'freight'], 'Logistics'],
  [['consumer', 'retail', 'luxury', 'hotel', 'travel', 'food', 'beverage'], 'Consumer Goods'],
  [['financial', 'bank', 'insurance', 'asset management'], 'Financials'],
  [['mining', 'mineral', 'rare earth'], 'Mining'],
  [['industrial', 'manufactur', 'machinery', 'equipment'], 'Industrials'],
  [['communication', 'media', 'entertainment', 'telecom'], 'Communication Services'],
  [['auto', 'vehicle', 'ev ', 'electric vehicle'], 'Automotive'],
  [['material', 'chemical', 'steel', 'metal'], 'Materials'],
  [['utilit'], 'Utilities'],
  [['agri', 'farm', 'fish', 'crop'], 'Agriculture'],
];

export function normalizeSector(raw: string): string {
  const lower = raw.toLowerCase().trim();

  // Exact match first
  if (SECTOR_NORMALIZE_MAP[lower]) {
    return SECTOR_NORMALIZE_MAP[lower];
  }

  // Keyword fallback
  for (const [keywords, canonical] of KEYWORD_FALLBACK) {
    if (keywords.some(kw => lower.includes(kw))) {
      return canonical;
    }
  }

  return raw;
}
