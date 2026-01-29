/**
 * Canonical list of industries for Corporate Impact filters.
 * Used for searchable industry selector; merged with API-returned sectors at runtime.
 */
export const CANONICAL_INDUSTRIES = [
  'Technology',
  'Software',
  'Semiconductors',
  'Hardware',
  'Energy',
  'Oil & Gas',
  'Renewable Energy',
  'Utilities',
  'Materials',
  'Industrials',
  'Aerospace & Defense',
  'Automotive',
  'Construction',
  'Finance',
  'Banking',
  'Insurance',
  'Healthcare',
  'Pharmaceuticals',
  'Biotechnology',
  'Consumer',
  'Retail',
  'Telecommunications',
  'Media',
  'Real Estate',
  'Agriculture',
  'Mining',
  'Chemicals',
  'Transportation',
  'Logistics',
  'Supply Chain',
] as const;

export type Industry = (typeof CANONICAL_INDUSTRIES)[number];

/** Merge API sectors with canonical list, dedupe and sort */
export function mergeIndustries(apiSectors: string[]): string[] {
  const set = new Set<string>([...CANONICAL_INDUSTRIES, ...apiSectors].filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
