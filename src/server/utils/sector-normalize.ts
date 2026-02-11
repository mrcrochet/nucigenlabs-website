/**
 * Sector normalization utility for Corporate Impact
 * Deduplicates semantic variants into canonical sector names.
 */

export const SECTOR_NORMALIZE_MAP: Record<string, string> = {
  'semiconductors/technology': 'Technology',
  'semiconductors': 'Technology',
  'defense/aerospace': 'Aerospace & Defense',
  'defense': 'Aerospace & Defense',
  'aerospace': 'Aerospace & Defense',
  'aerospace & defense': 'Aerospace & Defense',
  'mining & mineral exploration': 'Mining',
  'mining & rare earth elements': 'Mining',
  'mining & molybdenum': 'Mining',
  'mining & titanium': 'Mining',
  'fishing & seafood': 'Agriculture',
  'shipping & logistics': 'Logistics',
  'luxury goods': 'Consumer Goods',
  'financial services': 'Financials',
  'utilities': 'Utilities',
  'materials': 'Materials',
  'automotive': 'Automotive',
  'energy': 'Energy',
  'machinery': 'Industrials',
  'technology': 'Technology',
};

export function normalizeSector(raw: string): string {
  return SECTOR_NORMALIZE_MAP[raw.toLowerCase()] || raw;
}
