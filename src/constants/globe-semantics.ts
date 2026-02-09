/**
 * Globe view — sémantique des points et clé de lecture.
 * Mission : orienter l'attention, pas expliquer.
 */

export type GlobeCategory =
  | 'security'
  | 'supply-chain'
  | 'energy'
  | 'markets'
  | 'political';

export const GLOBE_CATEGORY_IDS: GlobeCategory[] = ['security', 'supply-chain', 'energy', 'markets', 'political'];

export const GLOBE_CATEGORIES: Record<
  GlobeCategory,
  { label: string; shortLabel: string; color: string }
> = {
  security: {
    label: 'Security / Conflict',
    shortLabel: 'Security',
    color: '#dc2626', // red
  },
  'supply-chain': {
    label: 'Supply Chain Disruption',
    shortLabel: 'Supply chain',
    color: '#ea580c', // orange
  },
  energy: {
    label: 'Energy / Resources',
    shortLabel: 'Energy',
    color: '#ca8a04', // yellow/amber
  },
  markets: {
    label: 'Markets / Finance',
    shortLabel: 'Markets',
    color: '#2563eb', // blue
  },
  political: {
    label: 'Political Decision',
    shortLabel: 'Political',
    color: '#a3a3a3', // neutral
  },
};

const SECURITY_KEYWORDS = ['security', 'conflict', 'military', 'defense', 'war', 'attack', 'sanctions'];
const SUPPLY_CHAIN_KEYWORDS = ['supply', 'chain', 'commodit', 'logistics', 'shipping', 'trade', 'export', 'import'];
const ENERGY_KEYWORDS = ['energy', 'oil', 'gas', 'electric', 'power', 'fuel', 'renewable'];
const MARKETS_KEYWORDS = ['market', 'finance', 'economy', 'stock', 'currency', 'bank', 'investment', 'inflation'];

function matchCategory(text: string): GlobeCategory {
  const t = text.toLowerCase();
  if (SECURITY_KEYWORDS.some((k) => t.includes(k))) return 'security';
  if (SUPPLY_CHAIN_KEYWORDS.some((k) => t.includes(k))) return 'supply-chain';
  if (ENERGY_KEYWORDS.some((k) => t.includes(k))) return 'energy';
  if (MARKETS_KEYWORDS.some((k) => t.includes(k))) return 'markets';
  return 'political';
}

export function eventToGlobeCategory(event: {
  event_type?: string | null;
  sectors?: string[];
  headline?: string;
}): GlobeCategory {
  const parts = [
    event.event_type,
    ...(event.sectors || []),
    event.headline,
  ].filter(Boolean) as string[];
  for (const p of parts) {
    const cat = matchCategory(p);
    if (cat !== 'political') return cat;
  }
  return 'political';
}

/** Importance 0–1 for point size (impact_score, confidence, or default). */
export function eventImportance(event: {
  impact_score?: number | null;
  impact?: number | null;
  confidence?: number | null;
}): number {
  const score = event.impact_score ?? event.impact ?? null;
  const conf = event.confidence ?? null;
  if (score != null && typeof score === 'number') return Math.min(1, Math.max(0, score / 100));
  if (conf != null && typeof conf === 'number') return Math.min(1, Math.max(0, conf / 100));
  return 0.5;
}

/** Impact scope for halo: local / regional / global. */
export type ImpactScope = 'local' | 'regional' | 'global';

export function eventImpactScope(event: {
  region?: string | null;
  country?: string | null;
  sectors?: string[];
}): ImpactScope {
  const r = (event.region || '').toLowerCase();
  const c = (event.country || '').toLowerCase();
  if (r.includes('global') || !r && !c) return 'global';
  if (r && (r.includes('europe') || r.includes('asia') || r.includes('middle east') || r.includes('africa') || r.includes('america'))) return 'regional';
  return 'local';
}

export function impactScopeToHaloPx(scope: ImpactScope): number {
  switch (scope) {
    case 'global': return 22;
    case 'regional': return 16;
    default: return 10;
  }
}

export function importanceToSizePx(importance: number): number {
  return 6 + Math.round(importance * 10); // 6–16px
}
