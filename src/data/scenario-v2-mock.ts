import type {
  ScenarioEvent,
  ScenarioBranch,
  DivergenceData,
  TransmissionGraphData,
  DecisionLeverageItem,
  HistoricalAnalog,
  ManipulationParameter,
} from '../types/scenario-v2';

// ---- Available Events ----
export const MOCK_EVENT_OPTIONS = [
  'Sanctions US contre l\'Iran — Escalade 2025',
  'Restrictions exportations chinoises — Semi-conducteurs',
  'Conflit Russie-Ukraine — Phase 3',
  'Coup d\'État Niger — Implications régionales',
];

// ---- Current Event ----
export const MOCK_EVENT: ScenarioEvent = {
  id: 'evt-iran-sanctions-2025',
  title: 'Sanctions US contre l\'Iran — Escalade 2025',
  description: 'Intensification des sanctions américaines sur le secteur pétrolier iranien avec menace de sanctions secondaires sur les acheteurs chinois.',
  region: 'Middle East',
  category: 'Geopolitics',
  lastUpdated: new Date().toISOString(),
  metrics: {
    tensionIndex: { value: 78, delta: 12, period: '24H' },
    escalationScore: { value: 6.4, delta: 0.8, period: '48H' },
    diplomaticActivity: { value: 42, delta: -8, period: 'WEEK' },
    economicPressure: { value: 85, delta: 15, period: 'WEEK' },
  },
};

// ---- Scenario Branches ----
export const MOCK_BRANCHES: ScenarioBranch[] = [
  {
    id: 'branch-best',
    type: 'best',
    name: 'BEST CASE // DÉSESCALADE RAPIDE',
    description: 'Accord diplomatique breakthrough, sanctions levées progressivement, normalisation régionale.',
    probability: 25,
    horizon: '3M',
    impactPercent: -2.3,
    commodityImpact: 'OIL: -$15/BBL',
    conditionalProbabilities: [
      { label: 'P(Désescalade | Accord diplomatique)', probability: 0.72 },
      { label: 'P(Normalisation | Levée sanctions)', probability: 0.58 },
    ],
  },
  {
    id: 'branch-base',
    type: 'base',
    name: 'BASE CASE // STABILISATION PARTIELLE',
    description: 'Status quo prolongé, sanctions maintenues, tensions modérées mais stables.',
    probability: 45,
    horizon: '6M',
    impactPercent: 1.8,
    commodityImpact: 'OIL: +$8/BBL',
    conditionalProbabilities: [
      { label: 'P(Status quo | Pas d\'escalade)', probability: 0.65 },
      { label: 'P(Sanctions maintenues | Élections US)', probability: 0.81 },
    ],
  },
  {
    id: 'branch-worst',
    type: 'worst',
    name: 'WORST CASE // ESCALADE MAJEURE',
    description: 'Conflit militaire direct, sanctions totales, disruption supply chains critiques, spillover régional.',
    probability: 30,
    horizon: '12M',
    impactPercent: 12.7,
    commodityImpact: 'OIL: +$45/BBL',
    conditionalProbabilities: [
      { label: 'P(Escalade | Oil > $100)', probability: 0.68 },
      { label: 'P(Spillover | Alliances régionales)', probability: 0.43 },
    ],
  },
];

// ---- Divergence Data ----
export const MOCK_DIVERGENCE: DivergenceData = {
  modelProbability: 45,
  crowdProbability: 72,
  delta: 27,
  confidenceAdjustment: 0.82,
  volumeWeighted: '$2.4M',
  crowdVolatility7d: 18.3,
};

// ---- Transmission Graph ----
export const MOCK_TRANSMISSION: TransmissionGraphData = {
  nodes: [
    { id: 'event', label: 'EVENT', type: 'event', impactScore: 9.2, sensitivity: 'Critical', lagTime: 'Immediate', historicalCorrelation: 1.0 },
    { id: 'energy', label: 'ENERGY', type: 'sector', impactScore: 8.5, sensitivity: 'High', lagTime: '1-2 weeks', historicalCorrelation: 0.89 },
    { id: 'shipping', label: 'SHIPPING', type: 'sector', impactScore: 7.1, sensitivity: 'High', lagTime: '2-4 weeks', historicalCorrelation: 0.74 },
    { id: 'europe', label: 'EUROPE', type: 'region', impactScore: 6.8, sensitivity: 'Medium', lagTime: '1-3 months', historicalCorrelation: 0.65 },
    { id: 'asia', label: 'ASIA', type: 'region', impactScore: 7.4, sensitivity: 'High', lagTime: '2-6 weeks', historicalCorrelation: 0.71 },
    { id: 'mena', label: 'MENA', type: 'region', impactScore: 8.9, sensitivity: 'Critical', lagTime: '1-2 weeks', historicalCorrelation: 0.92 },
    { id: 'banks', label: 'BANKS', type: 'asset', impactScore: 5.2, sensitivity: 'Medium', lagTime: '1-3 months', historicalCorrelation: 0.48 },
    { id: 'tech', label: 'TECH', type: 'asset', impactScore: 4.8, sensitivity: 'Low', lagTime: '3-6 months', historicalCorrelation: 0.35 },
    { id: 'defense', label: 'DEFENSE', type: 'asset', impactScore: 7.6, sensitivity: 'High', lagTime: '1-2 weeks', historicalCorrelation: 0.82 },
  ],
  links: [
    { source: 'event', target: 'energy', weight: 0.9 },
    { source: 'event', target: 'shipping', weight: 0.7 },
    { source: 'energy', target: 'europe', weight: 0.6 },
    { source: 'energy', target: 'asia', weight: 0.7 },
    { source: 'energy', target: 'mena', weight: 0.85 },
    { source: 'shipping', target: 'europe', weight: 0.5 },
    { source: 'shipping', target: 'asia', weight: 0.65 },
    { source: 'europe', target: 'banks', weight: 0.5 },
    { source: 'asia', target: 'tech', weight: 0.6 },
    { source: 'mena', target: 'defense', weight: 0.8 },
    { source: 'europe', target: 'tech', weight: 0.3 },
    { source: 'mena', target: 'energy', weight: 0.4 },
  ],
};

// ---- Decision Leverage ----
export const MOCK_DECISION_LEVERAGE: DecisionLeverageItem[] = [
  { label: 'STRATEGIC EXPOSURE RISK', value: 'HIGH', severity: 'high' },
  { label: 'POSITION SIZING', value: 'REDUCE 15-20%', severity: 'medium' },
  { label: 'HEDGING DIRECTION', value: 'LONG VIX / SHORT EM', severity: 'medium' },
  { label: 'DEFENSIVE ALLOCATION', value: '+8% GOLD / +5% CHF', severity: 'low' },
  { label: 'EARLY TRIGGER WATCH', value: 'OIL > $95', severity: 'critical' },
];

// ---- Historical Analogs ----
export const MOCK_ANALOGS: HistoricalAnalog[] = [
  {
    id: 'analog-1973',
    name: '1973 OIL SHOCK',
    year: 1973,
    similarityPercent: 78,
    description: 'Supply disruption + geopolitical tension → 300% price surge',
  },
  {
    id: 'analog-2014',
    name: '2014 CRIMEA ANNEXATION',
    year: 2014,
    similarityPercent: 65,
    description: 'Sanctions escalation → Energy sector volatility +18%',
  },
  {
    id: 'analog-2003',
    name: '2003 IRAQ INVASION',
    year: 2003,
    similarityPercent: 52,
    description: 'Military intervention → Regional destabilization',
  },
];

// ---- War-Game Parameters ----
export const MOCK_WAR_GAME_PARAMS: ManipulationParameter[] = [
  {
    id: 'tension',
    label: 'TENSION LEVEL',
    min: 0,
    max: 100,
    value: 60,
    formatValue: (val) => val < 50 ? `-${50 - val}%` : `+${val - 50}%`,
  },
  {
    id: 'sanctions',
    label: 'SANCTIONS INTENSITY',
    min: 0,
    max: 100,
    value: 50,
    formatValue: (val) => val < 33 ? 'LOW' : val < 66 ? 'MEDIUM' : 'HIGH',
  },
  {
    id: 'supply',
    label: 'SUPPLY DISRUPTION',
    min: 0,
    max: 100,
    value: 30,
    formatValue: (val) => `${Math.round(val * 0.5)}%`,
  },
];

// ---- Recalculation Logic ----
export function recalculateBranches(
  baseBranches: ScenarioBranch[],
  params: ManipulationParameter[],
): ScenarioBranch[] {
  const tension = params.find(p => p.id === 'tension')?.value ?? 50;
  const sanctions = params.find(p => p.id === 'sanctions')?.value ?? 50;
  const supply = params.find(p => p.id === 'supply')?.value ?? 30;

  // Higher tension/sanctions/supply → worst goes up, best goes down
  const aggression = (tension + sanctions + supply) / 300; // 0-1

  const bestBase = baseBranches.find(b => b.type === 'best')!.probability;
  const baseBase = baseBranches.find(b => b.type === 'base')!.probability;
  const worstBase = baseBranches.find(b => b.type === 'worst')!.probability;

  const shift = (aggression - 0.47) * 30; // centered around default ~47%

  const rawBest = Math.max(5, bestBase - shift * 1.2);
  const rawWorst = Math.max(5, worstBase + shift * 1.5);
  const rawBase = 100 - rawBest - rawWorst;

  // Normalize to 100
  const total = rawBest + rawBase + rawWorst;

  return baseBranches.map(b => ({
    ...b,
    probability: Math.round(
      b.type === 'best' ? (rawBest / total) * 100 :
      b.type === 'base' ? (rawBase / total) * 100 :
      (rawWorst / total) * 100
    ),
  }));
}
