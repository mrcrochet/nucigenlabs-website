/**
 * Path Generation Algorithm — Detective core reasoning.
 * See CONCEPTION_PATH_ALGORITHM.md.
 *
 * Input: InvestigationGraph (nodes + edges).
 * Output: Multiple investigative paths with lifecycle and scoring.
 *
 * Edges = raw material. Paths = intelligence.
 */

import type {
  InvestigationGraph,
  InvestigationGraphEdge,
  InvestigationGraphNode,
  InvestigationGraphPath,
  InvestigationPathStatus,
} from '../../types/investigation-graph';

/** Internal: a path candidate before scoring and lifecycle. */
export interface PathCandidate {
  id: string;
  nodes: string[];
  edges: InvestigationGraphEdge[];
}

const MIN_NODES_FOR_BIRTH = 3;
const MIN_SOURCES_FOR_BIRTH = 2;
const CONFIDENCE_ACTIVE = 0.65;
const CONFIDENCE_WEAK = 0.4;
const WEAK_EDGE_STRENGTH_THRESHOLD = 0.5;
const MAX_PATH_SCORE = 0.92;

/** Build adjacency: from -> [to], and in-degree / out-degree. */
function buildAdjacency(graph: InvestigationGraph) {
  const outEdges = new Map<string, InvestigationGraphEdge[]>();
  const inEdges = new Map<string, InvestigationGraphEdge[]>();
  for (const e of graph.edges) {
    if (!outEdges.has(e.from)) outEdges.set(e.from, []);
    outEdges.get(e.from)!.push(e);
    if (!inEdges.has(e.to)) inEdges.set(e.to, []);
    inEdges.get(e.to)!.push(e);
  }
  return { outEdges, inEdges };
}

/** Roots = nodes with no incoming edges. */
function findRoots(graph: InvestigationGraph, inEdges: Map<string, InvestigationGraphEdge[]>): string[] {
  return graph.nodes.filter((n) => !inEdges.has(n.id) || inEdges.get(n.id)!.length === 0).map((n) => n.id);
}

/** Outcomes = nodes with no outgoing edges. */
function findOutcomes(graph: InvestigationGraph, outEdges: Map<string, InvestigationGraphEdge[]>): string[] {
  return graph.nodes.filter((n) => !outEdges.has(n.id) || outEdges.get(n.id)!.length === 0).map((n) => n.id);
}

/** Enumerate all simple paths from root to outcome or dead-end (bounded depth). */
function enumeratePaths(
  rootId: string,
  outEdges: Map<string, InvestigationGraphEdge[]>,
  outcomeIds: Set<string>,
  maxDepth: number
): PathCandidate[] {
  const results: PathCandidate[] = [];
  const nodeById = new Map<string, { out: InvestigationGraphEdge[] }>();
  outEdges.forEach((out, id) => nodeById.set(id, { out }));

  function dfs(currentId: string, pathNodeIds: string[], pathEdges: InvestigationGraphEdge[], depth: number) {
    if (depth > maxDepth) return;
    const node = nodeById.get(currentId);
    const isOutcome = outcomeIds.has(currentId);
    const isDeadEnd = !node || node.out.length === 0;
    const canEnd = pathNodeIds.length >= MIN_NODES_FOR_BIRTH && (isOutcome || isDeadEnd);
    if (canEnd) {
      results.push({ id: '', nodes: [...pathNodeIds], edges: [...pathEdges] });
    }
    if (!node) return;
    let hasSuccessor = false;
    for (const e of node.out) {
      if (pathNodeIds.includes(e.to)) continue;
      hasSuccessor = true;
      dfs(e.to, [...pathNodeIds, e.to], [...pathEdges, e], depth + 1);
    }
    if (!hasSuccessor && !canEnd && pathNodeIds.length >= MIN_NODES_FOR_BIRTH) {
      results.push({ id: '', nodes: [...pathNodeIds], edges: [...pathEdges] });
    }
  }

  dfs(rootId, [rootId], [], 0);
  return results;
}

/** Path birth rule: ≥3 nodes, ≥2 distinct sources. */
function passesBirthRule(candidate: PathCandidate, graph: InvestigationGraph): boolean {
  if (candidate.nodes.length < MIN_NODES_FOR_BIRTH) return false;
  const sources = new Set<string>();
  for (const nodeId of candidate.nodes) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (node) {
      for (const s of node.sources) if (s) sources.add(s);
      if (node.label) sources.add(node.label);
    }
  }
  return sources.size >= MIN_SOURCES_FOR_BIRTH;
}

/** Score path 0..1: quantity, credibility, source diversity, temporal consistency, convergence, contradictions penalty. */
function scorePath(candidate: PathCandidate, graph: InvestigationGraph): number {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const pathNodes = candidate.nodes.map((id) => nodeMap.get(id)).filter(Boolean) as InvestigationGraphNode[];

  let quantity = Math.min(1, pathNodes.length / 8) * 0.15;
  const avgConf = pathNodes.reduce((s, n) => s + n.confidence, 0) / (pathNodes.length || 1);
  const credibility = (avgConf / 100) * 0.25;
  const sources = new Set<string>();
  pathNodes.forEach((n) => {
    n.sources.forEach((s) => s && sources.add(s));
    if (n.label) sources.add(n.label);
  });
  const sourceDiversity = sources.size >= MIN_SOURCES_FOR_BIRTH ? 0.2 : sources.size * 0.1;
  const temporalConsistency = checkTemporalConsistency(pathNodes) ? 0.2 : 0.05;
  const convergence = candidate.edges.length > 0 && pathNodes.length >= 3 ? 0.1 : 0;
  const weakCount = candidate.edges.filter((e) => e.strength < WEAK_EDGE_STRENGTH_THRESHOLD).length;
  const totalEdges = candidate.edges.length || 1;
  const weakRatio = totalEdges > 0 ? weakCount / totalEdges : 0;
  const contradictionPenalty = 0.4 * weakRatio;

  const raw =
    quantity + credibility + sourceDiversity + temporalConsistency + convergence - contradictionPenalty;
  return Math.min(MAX_PATH_SCORE, Math.max(0, raw));
}

function checkTemporalConsistency(nodes: InvestigationGraphNode[]): boolean {
  const withDate = nodes.filter((n) => n.date).map((n) => ({ id: n.id, t: new Date(n.date!).getTime() }));
  if (withDate.length < 2) return true;
  for (let i = 1; i < withDate.length; i++) {
    if (withDate[i].t < withDate[i - 1].t) return false;
  }
  return true;
}

/** Lifecycle: ACTIVE ≥0.65, WEAK 0.40–0.65, DEAD <0.40 or strongly contradicted. Dead never deleted. */
function pathStatus(score: number, candidate: PathCandidate): InvestigationPathStatus {
  const weakEdges = candidate.edges.filter((e) => e.strength < WEAK_EDGE_STRENGTH_THRESHOLD).length;
  const stronglyContradicted = candidate.edges.length > 0 && weakEdges / candidate.edges.length > 0.5;
  if (score < CONFIDENCE_WEAK || stronglyContradicted) return 'dead';
  if (score >= CONFIDENCE_ACTIVE) return 'active';
  return 'weak';
}

/**
 * Build multiple investigative paths from a graph (nodes + edges).
 * - Path birth: ≥3 nodes, ≥2 distinct sources, coherent chain.
 * - Scoring: quantity, credibility, source diversity, temporal consistency, convergence, contradictions.
 * - Lifecycle: active / weak / dead (dead paths are kept).
 * - Competing paths: all candidates returned, sorted by confidence.
 */
export function buildPaths(graph: InvestigationGraph): InvestigationGraphPath[] {
  if (graph.nodes.length === 0) return [];
  if (graph.edges.length === 0) {
    const singlePath: InvestigationGraphPath = {
      id: 'path-single',
      nodes: [...graph.nodes].sort((a, b) => (a.date && b.date ? new Date(a.date).getTime() - new Date(b.date).getTime() : 0)).map((n) => n.id),
      status: graph.nodes.length >= MIN_NODES_FOR_BIRTH ? 'active' : 'weak',
      confidence: 50,
    };
    return [singlePath];
  }

  const { outEdges, inEdges } = buildAdjacency(graph);
  const roots = findRoots(graph, inEdges);
  const outcomes = findOutcomes(graph, outEdges);
  const outcomeSet = new Set(outcomes.length > 0 ? outcomes : graph.nodes.map((n) => n.id));

  const candidates: PathCandidate[] = [];
  const seenKey = new Set<string>();
  for (const rootId of roots) {
    const paths = enumeratePaths(rootId, outEdges, outcomeSet, 15);
    for (const p of paths) {
      const key = p.nodes.join('|');
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      if (passesBirthRule(p, graph)) {
        p.id = `path-${candidates.length}`;
        candidates.push(p);
      }
    }
  }

  if (candidates.length === 0) {
    const sorted = [...graph.nodes].sort((a, b) =>
      a.date && b.date ? new Date(a.date).getTime() - new Date(b.date).getTime() : 0
    );
    const fallback: InvestigationGraphPath = {
      id: 'path-fallback',
      nodes: sorted.map((n) => n.id),
      status: sorted.length >= MIN_NODES_FOR_BIRTH ? 'weak' : 'dead',
      confidence: 45,
    };
    return [fallback];
  }

  const scored = candidates.map((c) => ({
    candidate: c,
    score: scorePath(c, graph),
  }));
  scored.sort((a, b) => b.score - a.score);

  return scored.map(({ candidate, score }, i) => ({
    id: `path-${i}`,
    nodes: candidate.nodes,
    status: pathStatus(score, candidate),
    confidence: Math.round(score * 100),
  }));
}
