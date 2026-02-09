/**
 * Demo fixture for Enquêtes — read-only showcase when threadId === DEMO_THREAD_ID.
 * Paths include keyNodes and evidence; some nodes have lat/lon for map view.
 */

import type { InvestigationGraph } from '../../types/investigation-graph';
import type { InvestigationThread, InvestigationSignal, InvestigationMessage } from '../../types/investigation';

export const DEMO_THREAD_ID = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee';

export const DEMO_THREAD_PAYLOAD: {
  thread: InvestigationThread;
  messages: InvestigationMessage[];
  signals: InvestigationSignal[];
} = {
  thread: {
    id: DEMO_THREAD_ID,
    user_id: '00000000-0000-0000-0000-000000000000',
    title: 'Démo Analyste — Prix des matières premières',
    initial_hypothesis:
      'La hausse récente des prix s’explique par plusieurs mécanismes possibles : choc d’offre (sanctions, corridors), stress climatique sur les stocks, ou mouvements spéculatifs.',
    scope: 'commodities',
    status: 'active',
    confidence_score: 65,
    investigative_axes: [
      'Sanctions et réduction d’approvisionnement',
      'Conditions météo et stockage',
      'Dynamique spéculative',
    ],
    blind_spots: ['Données de positionnement des fonds', 'Capacités de stockage réelles'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  messages: [],
  signals: [
    { id: 'demo-s1', thread_id: DEMO_THREAD_ID, type: 'article', source: 'EU sanctions on energy exports', url: 'https://example.com/sanctions', date: '2024-01-05', actors: [], summary: 'New restrictions.', credibility_score: 'A', extracted_facts: [], impact_on_hypothesis: 'supports', created_at: '2024-01-05T10:00:00Z' },
    { id: 'demo-s2', thread_id: DEMO_THREAD_ID, type: 'data', source: 'Supply cut in key corridors', url: 'https://example.com/supply', date: '2024-01-12', actors: [], summary: 'Volumes down.', credibility_score: 'B', extracted_facts: [], impact_on_hypothesis: 'supports', created_at: '2024-01-12T10:00:00Z' },
    { id: 'demo-s3', thread_id: DEMO_THREAD_ID, type: 'data', source: 'Price spike (benchmark)', url: 'https://example.com/price', date: '2024-01-20', actors: [], summary: 'Sharp increase.', credibility_score: 'B', extracted_facts: [], impact_on_hypothesis: 'neutral', created_at: '2024-01-20T10:00:00Z' },
    { id: 'demo-s4', thread_id: DEMO_THREAD_ID, type: 'report', source: 'Extreme weather events', url: 'https://example.com/weather', date: '2024-01-04', actors: [], summary: 'Disruption.', credibility_score: 'B', extracted_facts: [], impact_on_hypothesis: 'weakens', created_at: '2024-01-04T10:00:00Z' },
    { id: 'demo-s5', thread_id: DEMO_THREAD_ID, type: 'data', source: 'Storage stress', url: 'https://example.com/storage', date: '2024-01-15', actors: [], summary: 'Below norms.', credibility_score: 'C', extracted_facts: [], impact_on_hypothesis: 'neutral', created_at: '2024-01-15T10:00:00Z' },
    { id: 'demo-s6', thread_id: DEMO_THREAD_ID, type: 'article', source: 'Speculation-driven flows', url: 'https://example.com/spec', date: '2024-01-10', actors: [], summary: 'Evidence contested.', credibility_score: 'D', extracted_facts: [], impact_on_hypothesis: 'weakens', created_at: '2024-01-10T10:00:00Z' },
  ],
};

const NODES: InvestigationGraph['nodes'] = [
  { id: 'demo-n1', type: 'event', label: 'EU sanctions on energy exports', date: '2024-01-05', confidence: 85, sources: ['https://example.com/sanctions'], lat: 50.85, lon: 4.35 },
  { id: 'demo-n2', type: 'event', label: 'Supply cut in key corridors', date: '2024-01-12', confidence: 80, sources: ['https://example.com/supply'], lat: 52.52, lon: 13.4 },
  { id: 'demo-n3', type: 'event', label: 'Price spike (benchmark)', date: '2024-01-20', confidence: 75, sources: ['https://example.com/price'], lat: 51.5, lon: 0 },
  { id: 'demo-n4', type: 'event', label: 'Extreme weather events', date: '2024-01-04', confidence: 70, sources: ['https://example.com/weather'], lat: 41.9, lon: 12.5 },
  { id: 'demo-n5', type: 'event', label: 'Storage stress', date: '2024-01-15', confidence: 55, sources: ['https://example.com/storage'], lat: 48.85, lon: 2.35 },
  { id: 'demo-n6', type: 'event', label: 'Speculation-driven flows', date: '2024-01-10', confidence: 35, sources: ['https://example.com/spec'], lat: 40.71, lon: -74.01 },
];

const EDGES: InvestigationGraph['edges'] = [
  { from: 'demo-n1', to: 'demo-n2', relation: 'influences', strength: 0.85, confidence: 82 },
  { from: 'demo-n2', to: 'demo-n3', relation: 'influences', strength: 0.85, confidence: 78 },
  { from: 'demo-n4', to: 'demo-n5', relation: 'influences', strength: 0.6, confidence: 62 },
  { from: 'demo-n5', to: 'demo-n3', relation: 'influences', strength: 0.55, confidence: 58 },
  { from: 'demo-n6', to: 'demo-n3', relation: 'influences', strength: 0.35, confidence: 38 },
];

const PATHS: InvestigationGraph['paths'] = [
  {
    id: 'path-demo-a',
    nodes: ['demo-n1', 'demo-n2', 'demo-n3'],
    status: 'active',
    confidence: 78,
    hypothesis_label: 'Sanctions-driven supply shock',
    lastUpdate: 'il y a 2 h',
    keyNodes: [
      { id: 'demo-n1', type: 'event', label: 'EU sanctions on energy exports' },
      { id: 'demo-n2', type: 'event', label: 'Supply cut in key corridors' },
      { id: 'demo-n3', type: 'event', label: 'Price spike (benchmark)' },
    ],
    evidence: [
      { source: 'https://example.com/sanctions', confidence: 'high' },
      { source: 'https://example.com/supply', confidence: 'high' },
      { source: 'https://example.com/price', confidence: 'medium' },
    ],
  },
  {
    id: 'path-demo-b',
    nodes: ['demo-n4', 'demo-n5', 'demo-n3'],
    status: 'weak',
    confidence: 52,
    hypothesis_label: 'Weather and storage stress',
    lastUpdate: 'il y a 5 h',
    keyNodes: [
      { id: 'demo-n4', type: 'event', label: 'Extreme weather events' },
      { id: 'demo-n5', type: 'event', label: 'Storage stress' },
      { id: 'demo-n3', type: 'event', label: 'Price spike (benchmark)' },
    ],
    evidence: [
      { source: 'https://example.com/weather', confidence: 'medium' },
      { source: 'https://example.com/storage', confidence: 'medium' },
      { source: 'https://example.com/price', confidence: 'medium' },
    ],
  },
  {
    id: 'path-demo-c',
    nodes: ['demo-n6', 'demo-n3'],
    status: 'dead',
    confidence: 28,
    hypothesis_label: 'Speculation-only',
    lastUpdate: 'il y a 1 j',
    contradictions: ['Données de positionnement des fonds non corrélées à la hausse', 'Crédibilité source D'],
    keyNodes: [
      { id: 'demo-n6', type: 'event', label: 'Speculation-driven flows' },
      { id: 'demo-n3', type: 'event', label: 'Price spike (benchmark)' },
    ],
    evidence: [
      { source: 'https://example.com/spec', confidence: 'low' },
      { source: 'https://example.com/price', confidence: 'medium' },
    ],
  },
];

export const DEMO_GRAPH_FIXTURE: InvestigationGraph = { nodes: NODES, edges: EDGES, paths: PATHS };

export function getDemoGraphFixture(): InvestigationGraph {
  return DEMO_GRAPH_FIXTURE;
}
