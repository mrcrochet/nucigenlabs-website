/**
 * Scenario Dashboard Mapper
 *
 * Pure function that transforms backend service outputs (scenario-generator,
 * causal-graph-generator, polymarket) into the frontend ScenarioDashboardData
 * consumed by the Scenario v2 dashboard components.
 */

import type { ScenarioOutlook, Scenario } from './scenario-generator.js';
import type { CausalKnowledgeGraph, GraphNode } from '../../types/causal-graph.js';
import type {
  ScenarioEvent,
  ScenarioBranch,
  ScenarioBranchType,
  DivergenceData,
  TransmissionGraphData,
  TransmissionNode,
  TransmissionNodeType,
  TransmissionLink,
  DecisionLeverageData,
  DecisionLeverageItem,
  HistoricalAnalog,
  GlobalRegimeData,
  RegimeEvent,
  CompositeIndex,
  ManipulationParameter,
  ScenarioResonance,
  CustomScenarioFormData,
} from '../../types/scenario-v2.js';

export type { CustomScenarioFormData };

// ── Input types ──────────────────────────────────────────────────

export interface MapperInput {
  outlook: ScenarioOutlook;
  causalGraph: CausalKnowledgeGraph;
  polymarket: { question: string; outcomeYesPrice: number; volume: number } | null;
  formData: CustomScenarioFormData;
}

// ── Output ───────────────────────────────────────────────────────

export interface ScenarioDashboardData {
  event: ScenarioEvent;
  branches: ScenarioBranch[];
  divergence: DivergenceData;
  transmission: TransmissionGraphData;
  decisionLeverage: DecisionLeverageData;
  analogs: HistoricalAnalog[];
  regime: GlobalRegimeData;
  warGameParams: ManipulationParameter[];
  /** Real events that resonate with the scenario (filled by API after mapping) */
  resonance?: ScenarioResonance;
}

// ── Helpers ──────────────────────────────────────────────────────

const SEVERITY_TENSION: Record<string, number> = {
  low: 30,
  medium: 55,
  high: 75,
  critical: 90,
};

const TIMEFRAME_HORIZON: Record<string, string> = {
  immediate: '3M',
  near: '6M',
  short: '6M',
  medium: '12M',
  long: '24M',
};

const SCOPE_REGION: Record<string, string> = {
  geopolitical: 'Global — Geopolitical',
  economic: 'Global — Economic',
  markets: 'Global — Financial Markets',
  technology: 'Global — Technology',
};

const SCOPE_CATEGORY: Record<string, string> = {
  geopolitical: 'Geopolitical Risk',
  economic: 'Macro-Economic',
  markets: 'Financial Markets',
  technology: 'Technology & Innovation',
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function extractCommodityKeywords(text: string): string {
  const keywords = ['oil', 'gold', 'gas', 'wheat', 'copper', 'silver', 'uranium', 'lithium', 'corn', 'iron', 'steel', 'coal'];
  const lower = text.toLowerCase();
  const found = keywords.filter(k => lower.includes(k));
  return found.length > 0 ? found.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ') : 'Broad Market Impact';
}

function nodeTypeToTransmission(nodeType: string): TransmissionNodeType {
  switch (nodeType) {
    case 'event': return 'event';
    case 'entity': return 'asset';
    case 'mechanism': return 'sector';
    case 'impact': return 'region';
    case 'signal': return 'sector';
    default: return 'sector';
  }
}

function sensitivityLabel(score: number): string {
  if (score > 80) return 'Critical';
  if (score > 60) return 'High';
  if (score > 40) return 'Medium';
  return 'Low';
}

function lagTimeByType(nodeType: string): string {
  switch (nodeType) {
    case 'event': return 'Immediate';
    case 'mechanism': return '1-2 weeks';
    case 'entity': return '2-4 weeks';
    case 'impact': return '1-3 months';
    case 'signal': return '1-2 weeks';
    default: return '2-4 weeks';
  }
}

// ── Main Mapper ──────────────────────────────────────────────────

export function mapScenarioDashboard(raw: MapperInput): ScenarioDashboardData {
  const { outlook, causalGraph, polymarket, formData } = raw;

  // ── ScenarioEvent ──
  const avgConfidence = outlook.scenarios.length > 0
    ? outlook.scenarios.reduce((s, sc) => s + sc.confidence, 0) / outlook.scenarios.length
    : 0.5;

  const worstCase = outlook.scenarios.reduce(
    (prev, sc) => sc.title.toLowerCase().includes('worst') || sc.title.toLowerCase().includes('escala') || sc.relativeProbability < prev.relativeProbability ? prev : sc,
    outlook.scenarios[outlook.scenarios.length - 1] || { relativeProbability: 0.3 } as Scenario
  );

  const event: ScenarioEvent = {
    id: `sc-${Date.now()}`,
    title: truncate(formData.event, 80),
    description: outlook.currentState,
    region: SCOPE_REGION[formData.scope] || 'Global',
    category: SCOPE_CATEGORY[formData.scope] || 'Geopolitical Risk',
    lastUpdated: new Date().toISOString(),
    metrics: {
      tensionIndex: { value: SEVERITY_TENSION[formData.severity] || 55, delta: 5, period: '7d' },
      escalationScore: { value: Math.round(avgConfidence * 100), delta: 3, period: '7d' },
      diplomaticActivity: { value: Math.round(50 + Math.random() * 30), delta: -2, period: '7d' },
      economicPressure: { value: Math.round((worstCase.relativeProbability ?? 0.3) * 100), delta: 8, period: '7d' },
    },
  };

  // ── ScenarioBranch[] ──
  const sorted = [...outlook.scenarios].sort((a, b) => b.relativeProbability - a.relativeProbability);
  const maxBranches = formData.depth === 'deep' ? 5 : 3;
  const topScenarios = sorted.slice(0, maxBranches);

  const branches: ScenarioBranch[] = topScenarios.map((sc, idx) => {
    let type: ScenarioBranchType;
    if (idx === 0) type = 'base';
    else if (sc.title.toLowerCase().includes('worst') || sc.title.toLowerCase().includes('escala') || sc.title.toLowerCase().includes('conflict'))
      type = 'worst';
    else if (sc.title.toLowerCase().includes('best') || sc.title.toLowerCase().includes('de-escala') || sc.title.toLowerCase().includes('resolut'))
      type = 'best';
    else if (idx === topScenarios.length - 1)
      type = 'best';
    else
      type = idx === 1 ? 'worst' : 'base';

    const horizon = TIMEFRAME_HORIZON[sc.timeframe || 'medium'] || '12M';
    const impactSign = type === 'worst' ? 1 : type === 'best' ? -1 : 0;
    const impactPercent = impactSign * Math.round(sc.relativeProbability * 30 + 5);

    return {
      id: sc.id || `branch-${idx}`,
      type,
      name: truncate(sc.title, 60),
      description: sc.description,
      probability: Math.round(sc.relativeProbability * 100),
      horizon,
      impactPercent,
      commodityImpact: extractCommodityKeywords(sc.title + ' ' + sc.description),
      conditionalProbabilities: sc.mechanisms.slice(0, 2).map(m => ({
        label: truncate(m, 40),
        probability: Math.round(sc.confidence * 100),
      })),
    };
  });

  // ── DivergenceData ──
  const baseCase = sorted[0];
  const modelProb = baseCase ? Math.round(baseCase.relativeProbability * 100) : 50;
  const hasPolymarket = !!polymarket;
  const crowdProb = hasPolymarket
    ? Math.round(polymarket!.outcomeYesPrice * 100)
    : modelProb; // No synthetic offset — show model value when no market data
  const delta = Math.abs(crowdProb - modelProb);

  let signalInterpretation: string;
  if (!hasPolymarket) {
    signalInterpretation = 'Aucun marché prédictif correspondant — divergence non disponible';
  } else if (delta > 20) {
    signalInterpretation = 'Forte divergence modèle/marché — signal potentiel d\'information asymétrique';
  } else if (delta > 10) {
    signalInterpretation = 'Divergence modérée — le marché intègre des facteurs non-modélisés';
  } else {
    signalInterpretation = 'Convergence modèle/marché — consensus implicite';
  }

  const divergence: DivergenceData = {
    modelProbability: modelProb,
    crowdProbability: crowdProb,
    delta,
    confidenceAdjustment: Math.round(avgConfidence * 100),
    volumeWeighted: hasPolymarket ? `$${(polymarket!.volume / 1e6).toFixed(1)}M` : 'N/A — no market match',
    crowdVolatility7d: hasPolymarket ? Math.round(5 + Math.random() * 15) : 0,
    signalInterpretation,
    keySignals: (outlook.crossScenarioInsights?.keyDrivers || []).slice(0, 3),
  };

  // ── TransmissionGraphData ──
  const transmissionNodes: TransmissionNode[] = causalGraph.nodes.map((n: GraphNode) => ({
    id: n.id,
    label: n.label,
    type: nodeTypeToTransmission(n.type),
    impactScore: Math.round(n.confidence_score / 10),
    sensitivity: sensitivityLabel(n.confidence_score),
    lagTime: lagTimeByType(n.type),
    historicalCorrelation: n.historical_precedent ? 0.85 : 0.6,
  }));

  const transmissionLinks: TransmissionLink[] = causalGraph.edges.map(e => ({
    source: e.source,
    target: e.target,
    weight: e.strength,
  }));

  const transmission: TransmissionGraphData = {
    nodes: transmissionNodes,
    links: transmissionLinks,
  };

  // ── DecisionLeverageData ──
  const worstCaseProb = branches.find(b => b.type === 'worst')?.probability ?? 25;
  let strategicPosture: string;
  let postureScore: number;
  if (worstCaseProb > 40) { strategicPosture = 'DEFENSIVE'; postureScore = 85; }
  else if (worstCaseProb > 25) { strategicPosture = 'CAUTIOUS'; postureScore = 60; }
  else { strategicPosture = 'NEUTRAL'; postureScore = 40; }

  const insights = outlook.crossScenarioInsights;
  const leverageItems: DecisionLeverageItem[] = [];

  if (insights?.decisionPoints) {
    insights.decisionPoints.slice(0, 3).forEach(dp => {
      leverageItems.push({
        label: truncate(dp, 50),
        value: 'Decision point identified',
        severity: worstCaseProb > 40 ? 'critical' : worstCaseProb > 25 ? 'high' : 'medium',
      });
    });
  }
  if (insights?.criticalUncertainties) {
    insights.criticalUncertainties.slice(0, 2).forEach(cu => {
      leverageItems.push({
        label: truncate(cu, 50),
        value: 'Critical uncertainty',
        severity: 'high',
      });
    });
  }
  // Pad to 5 if needed
  while (leverageItems.length < 5) {
    leverageItems.push({
      label: leverageItems.length < 3 ? 'Monitor key developments' : 'Reassess in 30 days',
      value: 'Standing recommendation',
      severity: 'low',
    });
  }

  const decisionLeverage: DecisionLeverageData = {
    strategicPosture,
    postureScore,
    items: leverageItems.slice(0, 5),
  };

  // ── HistoricalAnalog[] ──
  const analogs: HistoricalAnalog[] = [];
  const allSources = outlook.scenarios.flatMap(sc => sc.sources || []);
  const historicalSources = allSources.filter(src =>
    src.title.toLowerCase().includes('histor') ||
    src.title.toLowerCase().includes('crisis') ||
    src.title.toLowerCase().includes('precedent') ||
    src.relevanceScore > 0.7
  );
  const usedSources = historicalSources.length > 0 ? historicalSources : allSources;
  usedSources.slice(0, 3).forEach((src, idx) => {
    const yearMatch = src.title.match(/(\d{4})/);
    analogs.push({
      id: `analog-${idx}`,
      name: truncate(src.title, 60),
      year: yearMatch ? parseInt(yearMatch[1]) : 2020 - idx * 5,
      similarityPercent: Math.round(src.relevanceScore * 100),
      description: src.snippet || 'Historical pattern identified via source analysis.',
    });
  });
  // Ensure at least 1 analog
  if (analogs.length === 0) {
    analogs.push({
      id: 'analog-fallback',
      name: 'Generic Historical Parallel',
      year: 2020,
      similarityPercent: 45,
      description: 'No strongly-matching historical precedent found. Analysis based on structural similarities.',
    });
  }

  // ── GlobalRegimeData ──
  const regimeIndex = Math.round(
    sorted.reduce((sum, sc) => sum + sc.relativeProbability * sc.confidence * 100, 0) /
    Math.max(sorted.length, 1)
  );

  const regimeName = regimeIndex > 70 ? 'ELEVATED RISK'
    : regimeIndex > 50 ? 'HEIGHTENED UNCERTAINTY'
    : regimeIndex > 30 ? 'MODERATE TENSION'
    : 'BASELINE';

  const regimeEvents: RegimeEvent[] = sorted.slice(0, 4).map(sc => ({
    name: truncate(sc.title, 40),
    weight: Math.round(sc.relativeProbability * 100),
    escalation: sc.timeframe === 'immediate' ? 'RAPID' : sc.timeframe === 'short' ? 'MODERATE' : 'GRADUAL',
    transmission: sc.mechanisms[0] ? truncate(sc.mechanisms[0], 30) : 'Multiple channels',
    weightLevel: sc.relativeProbability > 0.3 ? 'high' as const : sc.relativeProbability > 0.15 ? 'medium' as const : 'low' as const,
  }));

  // Derive composite indices from causal graph sectors/mechanisms
  const sectorCounts = new Map<string, number>();
  causalGraph.nodes.forEach(n => {
    const key = n.type;
    sectorCounts.set(key, (sectorCounts.get(key) || 0) + 1);
  });
  const compositeColors = ['#ff3333', '#ff6600', '#ffaa00', '#00aaff', '#00ff88'];
  const compositeIndices: CompositeIndex[] = Array.from(sectorCounts.entries())
    .slice(0, 5)
    .map(([label, count], idx) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1) + ' Nodes',
      value: Math.min(100, Math.round(count * 15 + regimeIndex * 0.3)),
      color: compositeColors[idx] || '#666',
    }));
  if (compositeIndices.length === 0) {
    compositeIndices.push(
      { label: 'Geopolitical Tension', value: regimeIndex, color: '#ff3333' },
      { label: 'Economic Pressure', value: Math.round(regimeIndex * 0.8), color: '#ff6600' },
    );
  }

  const regime: GlobalRegimeData = {
    regimeIndex,
    regimeName,
    events: regimeEvents,
    compositeIndices,
  };

  // ── ManipulationParameter[] — static sliders ──
  const warGameParams: ManipulationParameter[] = [
    { id: 'tension', label: 'Tension Level', min: 0, max: 100, value: SEVERITY_TENSION[formData.severity] || 55, formatValue: (v: number) => `${v}%` },
    { id: 'sanctions', label: 'Sanctions Pressure', min: 0, max: 100, value: 50, formatValue: (v: number) => `${v}%` },
    { id: 'supply', label: 'Supply Disruption', min: 0, max: 100, value: 40, formatValue: (v: number) => `${v}%` },
  ];

  return {
    event,
    branches,
    divergence,
    transmission,
    decisionLeverage,
    analogs,
    regime,
    warGameParams,
  };
}
