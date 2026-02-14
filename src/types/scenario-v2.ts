/**
 * Scenario v2 — Strategic Decision Engine Types
 */

// ---- Event State Model ----
export interface ScenarioEvent {
  id: string;
  title: string;
  description: string;
  region: string;
  category: string;
  lastUpdated: string;
  metrics: {
    tensionIndex: { value: number; delta: number; period: string };
    escalationScore: { value: number; delta: number; period: string };
    diplomaticActivity: { value: number; delta: number; period: string };
    economicPressure: { value: number; delta: number; period: string };
  };
}

// ---- Scenario Branches ----
export type ScenarioBranchType = 'best' | 'base' | 'worst';

export interface ScenarioBranch {
  id: string;
  type: ScenarioBranchType;
  name: string;
  description: string;
  probability: number;
  horizon: string;
  impactPercent: number;
  commodityImpact: string;
  conditionalProbabilities?: {
    label: string;
    probability: number;
  }[];
}

// ---- Divergence Monitor ----
export interface DivergenceData {
  modelProbability: number;
  crowdProbability: number;
  delta: number;
  confidenceAdjustment: number;
  volumeWeighted: string;
  crowdVolatility7d: number;
  signalInterpretation: string;
  keySignals: string[];
}

// ---- Transmission Graph ----
export type TransmissionNodeType = 'event' | 'sector' | 'region' | 'asset';

export interface TransmissionNode {
  id: string;
  label: string;
  type: TransmissionNodeType;
  impactScore: number;
  sensitivity: string;
  lagTime: string;
  historicalCorrelation: number;
  x?: number;
  y?: number;
}

export interface TransmissionLink {
  source: string;
  target: string;
  weight: number;
}

export interface TransmissionGraphData {
  nodes: TransmissionNode[];
  links: TransmissionLink[];
}

// ---- Decision Leverage ----
export interface DecisionLeverageItem {
  label: string;
  value: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DecisionLeverageData {
  strategicPosture: string;
  postureScore: number;
  items: DecisionLeverageItem[];
}

// ---- Historical Analogs ----
export interface HistoricalAnalog {
  id: string;
  name: string;
  year: number;
  similarityPercent: number;
  description: string;
}

// ---- War-Game Manipulation ----
export interface ManipulationParameter {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  formatValue: (val: number) => string;
}

// ---- Global Regime Dashboard ----
export interface RegimeEvent {
  name: string;
  weight: number;
  escalation: string;
  transmission: string;
  weightLevel: 'high' | 'medium' | 'low';
}

export interface CompositeIndex {
  label: string;
  value: number;
  color: string;
}

export interface GlobalRegimeData {
  regimeIndex: number;
  regimeName: string;
  events: RegimeEvent[];
  compositeIndices: CompositeIndex[];
}

// ---- Resonance (real events that match the scenario) ----
export interface ResonanceEvent {
  id: string;
  title: string;
  summary: string;
  country?: string;
  occurredAt?: string;
  investigateId: string;
}

export interface ScenarioResonance {
  events: ResonanceEvent[];
  total: number;
}

// ---- Custom Scenario Form Data ----
export interface CustomScenarioFormData {
  event: string;
  timeframe: 'immediate' | 'near' | 'long';
  severity: 'low' | 'medium' | 'high' | 'critical';
  scope: 'geopolitical' | 'economic' | 'markets' | 'technology';
  sectors: string;
  depth: 'standard' | 'deep';
}
