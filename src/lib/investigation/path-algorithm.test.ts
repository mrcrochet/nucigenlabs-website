/**
 * Path algorithm: unit-test-like examples.
 * Proves: a) branching creates multiple paths, b) contradictions lower confidence, c) dead paths remain returned.
 */

import { describe, it, expect } from 'vitest';
import { buildPaths } from './path-algorithm';
import type { InvestigationGraph } from '../../types/investigation-graph';

function makeNode(
  id: string,
  label: string,
  opts: { date?: string; confidence?: number; sources?: string[] } = {}
): InvestigationGraph['nodes'][0] {
  return {
    id,
    type: 'event',
    label,
    date: opts.date,
    confidence: opts.confidence ?? 70,
    sources: opts.sources ?? [`https://source-${id}.com`],
  };
}

describe('buildPaths', () => {
  it('returns empty array when graph has no nodes', () => {
    const graph: InvestigationGraph = { nodes: [], edges: [], paths: [] };
    expect(buildPaths(graph)).toEqual([]);
  });

  it('branching creates multiple paths (two roots → same outcome)', () => {
    // Path A: sanctions -> supply_cut -> price_spike
    // Path B: weather -> storage_stress -> price_spike
    const graph: InvestigationGraph = {
      nodes: [
        makeNode('sanctions', 'Sanctions', { date: '2024-01-01', sources: ['https://a.com'] }),
        makeNode('supply_cut', 'Supply cut', { date: '2024-01-02', sources: ['https://b.com'] }),
        makeNode('price_spike', 'Price spike', { date: '2024-01-03', sources: ['https://c.com'] }),
        makeNode('weather', 'Weather', { date: '2024-01-01', sources: ['https://d.com'] }),
        makeNode('storage_stress', 'Storage stress', { date: '2024-01-02', sources: ['https://e.com'] }),
      ],
      edges: [
        { from: 'sanctions', to: 'supply_cut', relation: 'influences', strength: 0.85, confidence: 80 },
        { from: 'supply_cut', to: 'price_spike', relation: 'influences', strength: 0.85, confidence: 80 },
        { from: 'weather', to: 'storage_stress', relation: 'influences', strength: 0.7, confidence: 70 },
        { from: 'storage_stress', to: 'price_spike', relation: 'influences', strength: 0.7, confidence: 70 },
      ],
      paths: [],
    };
    const paths = buildPaths(graph);
    expect(paths.length).toBeGreaterThanOrEqual(2);
    const pathLabels = paths.map((p) => p.nodes.join(' → '));
    const hasSanctionsPath = pathLabels.some((s) => s.includes('sanctions') && s.includes('price_spike'));
    const hasWeatherPath = pathLabels.some((s) => s.includes('weather') && s.includes('price_spike'));
    expect(hasSanctionsPath).toBe(true);
    expect(hasWeatherPath).toBe(true);
  });

  it('contradictions lower confidence (many weak edges → lower score / dead)', () => {
    const graph: InvestigationGraph = {
      nodes: [
        makeNode('n1', 'Event 1', { date: '2024-01-01', sources: ['https://x.com'] }),
        makeNode('n2', 'Event 2', { date: '2024-01-02', sources: ['https://y.com'] }),
        makeNode('n3', 'Event 3', { date: '2024-01-03', sources: ['https://z.com'] }),
        makeNode('n4', 'Event 4', { date: '2024-01-04', sources: ['https://w.com'] }),
      ],
      edges: [
        { from: 'n1', to: 'n2', relation: 'influences', strength: 0.35, confidence: 40 },
        { from: 'n2', to: 'n3', relation: 'influences', strength: 0.35, confidence: 40 },
        { from: 'n3', to: 'n4', relation: 'influences', strength: 0.35, confidence: 40 },
      ],
      paths: [],
    };
    const paths = buildPaths(graph);
    expect(paths.length).toBeGreaterThanOrEqual(1);
    const weakPath = paths.find((p) => p.nodes.length >= 3);
    expect(weakPath).toBeDefined();
    expect(weakPath!.confidence).toBeLessThan(65);
    expect(['weak', 'dead']).toContain(weakPath!.status);
  });

  it('dead paths remain in result (never deleted)', () => {
    const graph: InvestigationGraph = {
      nodes: [
        makeNode('a', 'A', { date: '2024-01-01', sources: ['https://s1.com'], confidence: 30 }),
        makeNode('b', 'B', { date: '2024-01-02', sources: ['https://s2.com'], confidence: 30 }),
        makeNode('c', 'C', { date: '2024-01-03', sources: ['https://s3.com'], confidence: 30 }),
      ],
      edges: [
        { from: 'a', to: 'b', relation: 'influences', strength: 0.35, confidence: 30 },
        { from: 'b', to: 'c', relation: 'influences', strength: 0.35, confidence: 30 },
      ],
      paths: [],
    };
    const paths = buildPaths(graph);
    expect(paths.length).toBeGreaterThanOrEqual(1);
    const deadOrWeak = paths.filter((p) => p.status === 'dead' || p.status === 'weak');
    expect(deadOrWeak.length).toBeGreaterThanOrEqual(1);
    paths.forEach((p) => {
      expect(p.nodes.length).toBeGreaterThanOrEqual(1);
      expect(['active', 'weak', 'dead']).toContain(p.status);
      expect(p.confidence).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeLessThanOrEqual(100);
    });
  });

  it('example output JSON: Path A (ACTIVE), Path B (WEAK), Path C (DEAD)', () => {
    const graph: InvestigationGraph = {
      nodes: [
        makeNode('sanctions', 'sanctions', { date: '2024-01-01', sources: ['https://a.com'], confidence: 85 }),
        makeNode('supply_cut', 'supply cut', { date: '2024-01-02', sources: ['https://b.com'], confidence: 80 }),
        makeNode('price_spike', 'price spike', { date: '2024-01-03', sources: ['https://c.com'], confidence: 80 }),
        makeNode('weather', 'weather', { date: '2024-01-01', sources: ['https://d.com'], confidence: 60 }),
        makeNode('storage_stress', 'storage stress', { date: '2024-01-02', sources: ['https://e.com'], confidence: 55 }),
        makeNode('spec', 'speculation-only', { date: '2024-01-02', sources: ['https://f.com'], confidence: 35 }),
      ],
      edges: [
        { from: 'sanctions', to: 'supply_cut', relation: 'influences', strength: 0.85, confidence: 82 },
        { from: 'supply_cut', to: 'price_spike', relation: 'influences', strength: 0.85, confidence: 80 },
        { from: 'weather', to: 'storage_stress', relation: 'influences', strength: 0.6, confidence: 58 },
        { from: 'storage_stress', to: 'price_spike', relation: 'influences', strength: 0.55, confidence: 55 },
        { from: 'spec', to: 'price_spike', relation: 'influences', strength: 0.35, confidence: 35 },
      ],
      paths: [],
    };
    const paths = buildPaths(graph);
    expect(paths.length).toBeGreaterThanOrEqual(1);
    const example = paths.slice(0, 5).map((p) => ({
      id: p.id,
      nodes: p.nodes,
      status: p.status,
      confidence: p.confidence / 100,
    }));
    expect(example.every((p) => ['active', 'weak', 'dead'].includes(p.status))).toBe(true);
    if (process.env.DEBUG_PATH_EXAMPLE) console.log(JSON.stringify(example, null, 2));
  });

  it('paths are sorted by confidence descending', () => {
    const graph: InvestigationGraph = {
      nodes: [
        makeNode('r1', 'Root 1', { date: '2024-01-01', sources: ['https://r1.com'], confidence: 90 }),
        makeNode('r2', 'Root 2', { date: '2024-01-01', sources: ['https://r2.com'], confidence: 90 }),
        makeNode('m1', 'Mid 1', { date: '2024-01-02', sources: ['https://m1.com'], confidence: 85 }),
        makeNode('m2', 'Mid 2', { date: '2024-01-02', sources: ['https://m2.com'], confidence: 70 }),
        makeNode('out', 'Outcome', { date: '2024-01-03', sources: ['https://out.com'], confidence: 80 }),
      ],
      edges: [
        { from: 'r1', to: 'm1', relation: 'influences', strength: 0.85, confidence: 85 },
        { from: 'm1', to: 'out', relation: 'influences', strength: 0.85, confidence: 85 },
        { from: 'r2', to: 'm2', relation: 'influences', strength: 0.6, confidence: 60 },
        { from: 'm2', to: 'out', relation: 'influences', strength: 0.6, confidence: 60 },
      ],
      paths: [],
    };
    const paths = buildPaths(graph);
    for (let i = 1; i < paths.length; i++) {
      expect(paths[i].confidence).toBeLessThanOrEqual(paths[i - 1].confidence);
    }
  });
});
