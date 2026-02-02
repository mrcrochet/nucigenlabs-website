/**
 * Build InvestigationGraph from thread + signals.
 * See CONCEPTION_ENGINE_IMPLEMENTATION.md and CONCEPTION_PATH_ALGORITHM.md.
 *
 * - Nodes: one per signal (type event).
 * - Edges: inferred from temporal order (consecutive by date/created_at); strength from impact_on_hypothesis.
 * - Paths: from path-algorithm (multi-path, scoring, lifecycle). Edges = raw material; paths = intelligence.
 */

import type { InvestigationThread, InvestigationSignal } from '../../types/investigation';
import type {
  InvestigationGraph,
  InvestigationGraphEdge,
  InvestigationGraphNode,
} from '../../types/investigation-graph';
import { buildPaths } from './path-algorithm';

const CREDIBILITY_TO_CONFIDENCE: Record<string, number> = {
  A: 90,
  B: 70,
  C: 50,
  D: 30,
};

/** Strength from signal impact on hypothesis (v1). */
function strengthFromImpact(impact: InvestigationSignal['impact_on_hypothesis']): number {
  if (impact === 'supports') return 0.85;
  if (impact === 'weakens') return 0.35;
  return 0.55;
}

/** Order signals by date then created_at. */
function orderSignals(signals: InvestigationSignal[]): InvestigationSignal[] {
  return [...signals].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : new Date(a.created_at).getTime();
    const db = b.date ? new Date(b.date).getTime() : new Date(b.created_at).getTime();
    return da - db;
  });
}

export function buildGraphFromSignals(
  _thread: InvestigationThread,
  signals: InvestigationSignal[]
): InvestigationGraph {
  const nodes: InvestigationGraphNode[] = signals.map((sig) => {
    const confidence =
      sig.credibility_score && CREDIBILITY_TO_CONFIDENCE[sig.credibility_score] != null
        ? CREDIBILITY_TO_CONFIDENCE[sig.credibility_score]
        : 50;
    return {
      id: sig.id,
      type: 'event',
      label: sig.source || sig.summary.slice(0, 60) || 'Signal',
      date: sig.date ?? undefined,
      confidence,
      sources: sig.url ? [sig.url] : [],
    };
  });

  const ordered = orderSignals(signals);
  const edges: InvestigationGraphEdge[] = [];

  for (let i = 0; i < ordered.length - 1; i++) {
    const fromId = ordered[i].id;
    const toId = ordered[i + 1].id;
    const toSignal = ordered[i + 1];
    const fromNode = nodes.find((n) => n.id === fromId);
    const toNode = nodes.find((n) => n.id === toId);
    if (!fromNode || !toNode) continue;
    const strength = strengthFromImpact(toSignal.impact_on_hypothesis);
    const confidence = Math.round((fromNode.confidence + toNode.confidence) / 2);
    edges.push({
      from: fromId,
      to: toId,
      relation: 'influences',
      strength,
      confidence,
    });
  }

  const graphWithoutPaths: InvestigationGraph = { nodes, edges, paths: [] };
  const paths = buildPaths(graphWithoutPaths);

  return {
    nodes,
    edges,
    paths,
  };
}
