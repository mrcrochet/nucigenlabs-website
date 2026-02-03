/**
 * Claim → Node/Edge (logique déterministe).
 *
 * - 1 claim → 1 node (id = claim.id, label = claim text, type = event).
 * - Ordre des claims par date puis created_at → chaîne.
 * - Arêtes entre claims consécutifs : relation = polarity (supports | weakens), strength = confidence du claim cible.
 *
 * Voir docs/SCHEMA_INVESTIGATION_ENGINE.md et docs/PIPELINE_INGESTION_DETECTIVE.md.
 */

import type { Claim } from '../../types/investigation-schema';
import type {
  InvestigationGraphEdge,
  InvestigationGraphNode,
  InvestigationEdgeRelation,
} from '../../types/investigation-graph';

const MAX_LABEL_LENGTH = 200;

/** Ordonne les claims par date puis created_at. */
function orderClaims(claims: Claim[]): Claim[] {
  return [...claims].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : new Date(a.created_at).getTime();
    const db = b.date ? new Date(b.date).getTime() : new Date(b.created_at).getTime();
    return da - db;
  });
}

/** Relation d'arête à partir de la polarité du claim cible. */
function edgeRelationFromPolarity(polarity: Claim['polarity']): InvestigationEdgeRelation {
  if (polarity === 'weakens') return 'weakens';
  if (polarity === 'supports') return 'supports';
  return 'influences';
}

/** Strength à partir de la polarité (aligné build-graph : supports fort, weakens faible). */
function strengthFromPolarity(polarity: Claim['polarity'], confidence: number): number {
  if (polarity === 'supports') return Math.min(0.95, 0.5 + confidence * 0.45);
  if (polarity === 'weakens') return Math.max(0.2, confidence * 0.4);
  return 0.5 * confidence + 0.25;
}

/**
 * Construit les nodes et edges du graphe à partir des claims.
 * Convention : node.confidence en 0..100 (affichage / path algorithm).
 */
export function buildGraphFromClaims(claims: Claim[]): {
  nodes: InvestigationGraphNode[];
  edges: InvestigationGraphEdge[];
} {
  const nodes: InvestigationGraphNode[] = claims.map((c) => ({
    id: c.id,
    type: 'event',
    label: (c.text || `${c.subject} ${c.action} ${c.object}`).slice(0, MAX_LABEL_LENGTH),
    date: c.date ?? undefined,
    confidence: Math.round((c.confidence ?? 0.5) * 100),
    sources: [c.source_url].filter(Boolean) as string[],
  }));

  const ordered = orderClaims(claims);
  const edges: InvestigationGraphEdge[] = [];

  for (let i = 0; i < ordered.length - 1; i++) {
    const fromClaim = ordered[i];
    const toClaim = ordered[i + 1];
    const fromNode = nodes.find((n) => n.id === fromClaim.id);
    const toNode = nodes.find((n) => n.id === toClaim.id);
    if (!fromNode || !toNode) continue;

    const relation = edgeRelationFromPolarity(toClaim.polarity);
    const strength = strengthFromPolarity(toClaim.polarity, toClaim.confidence ?? 0.5);
    const confidence = Math.round((fromNode.confidence + toNode.confidence) / 2);

    edges.push({
      from: fromClaim.id,
      to: toClaim.id,
      relation,
      strength,
      confidence,
    });
  }

  return { nodes, edges };
}
