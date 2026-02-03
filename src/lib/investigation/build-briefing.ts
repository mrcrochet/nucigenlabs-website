/**
 * Build Briefing payload from thread + graph. Read-only.
 * See docs/BRIEFING_MODEL.md and src/types/briefing.ts.
 *
 * The Briefing reads; it does not create, modify, or choose truth.
 */

import type { InvestigationGraph, InvestigationGraphNode } from '../../types/investigation-graph';
import type { InvestigationThread } from '../../types/investigation';
import type {
  BriefingPayload,
  BriefingSectionInvestigation,
  BriefingSectionPrimaryPath,
  BriefingSectionUncertainty,
  BriefingTurningPoint,
  BriefingAlternativePath,
} from '../../types/briefing';

const MAX_TURNING_POINTS = 4;
const MAX_KEY_NODES_PRIMARY = 4;
const LOW_CONFIDENCE_THRESHOLD = 50;
const WEAK_EDGE_STRENGTH = 0.5;
const DISCLAIMER =
  'This briefing is subject to change as new signals are integrated. It reflects current paths and uncertainties, not a final conclusion.';

function section1(thread: InvestigationThread): BriefingSectionInvestigation {
  return {
    hypothesis: thread.initial_hypothesis,
    title: thread.title,
    status: thread.status,
    updated_at: thread.updated_at,
    investigative_axes: thread.investigative_axes ?? [],
  };
}

function section2PrimaryPath(graph: InvestigationGraph): BriefingSectionPrimaryPath | null {
  if (graph.paths.length === 0) return null;
  const sorted = [...graph.paths].sort((a, b) => b.confidence - a.confidence);
  const primary = sorted[0];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const keyNodeIds: string[] = [];
  const nodes = primary.nodes
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as InvestigationGraphNode[];
  if (nodes.length === 0) return null;
  if (nodes.length <= MAX_KEY_NODES_PRIMARY) {
    keyNodeIds.push(...nodes.map((n) => n.id));
  } else {
    keyNodeIds.push(nodes[0].id);
    const mid = Math.floor(nodes.length / 2);
    keyNodeIds.push(nodes[mid].id);
    if (nodes.length > 3) keyNodeIds.push(nodes[Math.floor(nodes.length * 0.75)].id);
    keyNodeIds.push(nodes[nodes.length - 1].id);
  }
  return {
    path_id: primary.id,
    hypothesis_label: primary.hypothesis_label ?? primary.id,
    confidence: primary.confidence,
    status: primary.status,
    key_node_ids: keyNodeIds.slice(0, MAX_KEY_NODES_PRIMARY),
  };
}

function section3TurningPoints(graph: InvestigationGraph, primaryPathId: string | null): BriefingTurningPoint[] {
  const primary = primaryPathId ? graph.paths.find((p) => p.id === primaryPathId) : null;
  const pathNodeCount = new Map<string, number>();
  for (const p of graph.paths) {
    for (const nid of p.nodes) {
      pathNodeCount.set(nid, (pathNodeCount.get(nid) ?? 0) + 1);
    }
  }
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  for (const e of graph.edges) {
    outDegree.set(e.from, (outDegree.get(e.from) ?? 0) + 1);
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }
  const candidates: BriefingTurningPoint[] = [];
  for (const node of graph.nodes) {
    const inPaths = pathNodeCount.get(node.id) ?? 0;
    const branch = (inDegree.get(node.id) ?? 0) > 1 || (outDegree.get(node.id) ?? 0) > 1;
    const inPrimary = primary?.nodes.includes(node.id);
    if ((inPaths >= 2 || branch) && nodeMap.has(node.id)) {
      candidates.push({
        node_id: node.id,
        label: node.label,
        date: node.date ?? undefined,
        confidence: node.confidence,
      });
    }
  }
  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates.slice(0, MAX_TURNING_POINTS);
}

function section4Alternatives(graph: InvestigationGraph, primaryPathId: string | null): BriefingAlternativePath[] {
  return graph.paths
    .filter((p) => p.id !== primaryPathId)
    .map((p) => ({
      path_id: p.id,
      hypothesis_label: p.hypothesis_label ?? p.id,
      status: p.status,
      confidence: p.confidence,
    }));
}

function section5Uncertainty(
  thread: InvestigationThread,
  graph: InvestigationGraph,
  primaryPathId: string | null
): BriefingSectionUncertainty {
  const lowConfidenceNodeIds = graph.nodes
    .filter((n) => n.confidence < LOW_CONFIDENCE_THRESHOLD)
    .map((n) => n.id);
  const primary = primaryPathId ? graph.paths.find((p) => p.id === primaryPathId) : null;
  let hasContradictions = graph.paths.some((p) => p.status === 'dead');
  if (primary) {
    const primaryEdgeSet = new Set<string>();
    for (let i = 0; i < primary.nodes.length - 1; i++) {
      primaryEdgeSet.add(`${primary.nodes[i]}-${primary.nodes[i + 1]}`);
    }
    const weakOnPrimary = graph.edges.some(
      (e) => primaryEdgeSet.has(`${e.from}-${e.to}`) && e.strength < WEAK_EDGE_STRENGTH
    );
    if (weakOnPrimary) hasContradictions = true;
  }
  return {
    blind_spots: thread.blind_spots ?? [],
    low_confidence_node_ids: lowConfidenceNodeIds,
    has_contradictions: hasContradictions,
  };
}

/**
 * Build a Briefing payload from thread + graph. Read-only; no side effects.
 * Use for UI (Netflix mode) or export. Never modifies graph or thread.
 */
export function buildBriefingPayload(thread: InvestigationThread, graph: InvestigationGraph): BriefingPayload {
  const primary = section2PrimaryPath(graph);
  const primaryPathId = primary?.path_id ?? null;

  return {
    investigation: section1(thread),
    primary_path: primary,
    turning_points: section3TurningPoints(graph, primaryPathId),
    alternative_paths: section4Alternatives(graph, primaryPathId),
    uncertainty: section5Uncertainty(thread, graph, primaryPathId),
    disclaimer: DISCLAIMER,
  };
}

/** Format a Briefing payload as plain text for export (e.g. demo or future API). */
export function formatBriefingPayloadAsText(payload: BriefingPayload): string {
  const lines: string[] = [
    `# Intelligence Brief — ${payload.investigation.title}`,
    '',
    `Date: ${new Date(payload.investigation.updated_at).toISOString().slice(0, 10)}`,
    '',
    '## What is being investigated',
    payload.investigation.hypothesis,
    '',
    `Status: ${payload.investigation.status}`,
    '',
  ];
  if (payload.investigation.investigative_axes.length > 0) {
    lines.push('Investigative axes:', '');
    payload.investigation.investigative_axes.forEach((a) => lines.push(`- ${a}`));
    lines.push('');
  }
  if (payload.primary_path) {
    lines.push('## Primary path (current best explanation)', '');
    lines.push(payload.primary_path.hypothesis_label);
    lines.push(`${payload.primary_path.status} · ${payload.primary_path.confidence} %`);
    lines.push('');
  }
  if (payload.turning_points.length > 0) {
    lines.push('## Key turning points', '');
    payload.turning_points.forEach((tp) => {
      lines.push(`- ${tp.label}${tp.date ? ` (${tp.date})` : ''} · ${tp.confidence} %`);
    });
    lines.push('');
  }
  if (payload.alternative_paths.length > 0) {
    lines.push('## Alternative explanations', '');
    payload.alternative_paths.forEach((p) => {
      lines.push(`- ${p.hypothesis_label} (${p.status} · ${p.confidence} %)`);
    });
    lines.push('');
  }
  lines.push('## What is uncertain', '');
  if (payload.uncertainty.blind_spots.length > 0) {
    payload.uncertainty.blind_spots.forEach((b) => lines.push(`- ${b}`));
  }
  if (payload.uncertainty.low_confidence_node_ids.length > 0) {
    lines.push(`${payload.uncertainty.low_confidence_node_ids.length} node(s) with low confidence`);
  }
  if (payload.uncertainty.has_contradictions) {
    lines.push('Contradictions or weak evidence detected.');
  }
  lines.push('', '## Disclaimer', '', payload.disclaimer);
  return lines.join('\n');
}
