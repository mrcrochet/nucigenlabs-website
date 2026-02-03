/**
 * Persistance du graphe Detective : claims → nodes/edges → paths en base.
 *
 * 1) Charge les claims de detective_claims.
 * 2) Construit le graphe (buildGraphFromClaims) et les paths (buildPaths).
 * 3) Remplace tout le graphe pour cette enquête : nodes, edges, paths, path_nodes.
 *
 * Convention : thread_id (investigation_threads.id) = investigation_id (detective_investigations.id) pour 1:1.
 *
 * Voir docs/SCHEMA_INVESTIGATION_ENGINE.md et docs/PIPELINE_INGESTION_DETECTIVE.md.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Récupère ou crée une detective_investigation avec id = threadId (1:1 avec le thread).
 */
export async function getOrCreateDetectiveInvestigation(
  supabase: SupabaseClient,
  threadId: string,
  params: { title: string; hypothesis: string }
): Promise<string> {
  const { data: existing } = await supabase
    .from('detective_investigations')
    .select('id')
    .eq('id', threadId)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { error } = await supabase.from('detective_investigations').insert({
    id: threadId,
    title: params.title,
    hypothesis: params.hypothesis,
    status: 'ongoing',
  });
  if (error) throw new Error(`create detective_investigation: ${error.message}`);
  return threadId;
}

import type { Claim } from '../../types/investigation-schema.js';
import type {
  InvestigationGraph,
  InvestigationGraphEdge,
  InvestigationGraphNode,
  InvestigationGraphPath,
} from '../../types/investigation-graph.js';
import { buildGraphFromClaims } from '../../lib/investigation/build-graph-from-claims.js';
import { buildPaths } from '../../lib/investigation/path-algorithm.js';

export interface RebuildGraphResult {
  nodesCount: number;
  edgesCount: number;
  pathsCount: number;
  errors: string[];
}

/**
 * Charge les claims d'une enquête depuis detective_claims.
 */
export async function fetchClaimsForInvestigation(
  supabase: SupabaseClient,
  investigationId: string
): Promise<Claim[]> {
  const { data, error } = await supabase
    .from('detective_claims')
    .select('*')
    .eq('investigation_id', investigationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`fetch claims: ${error.message}`);
  return (data || []) as Claim[];
}

/**
 * Reconstruit le graphe (nodes, edges, paths) à partir des claims et persiste en base.
 * Remplace entièrement les detective_nodes, detective_edges, detective_paths, detective_path_nodes pour cette enquête.
 */
export async function rebuildAndPersistGraph(
  supabase: SupabaseClient,
  investigationId: string
): Promise<RebuildGraphResult> {
  const errors: string[] = [];
  let nodesCount = 0;
  let edgesCount = 0;
  let pathsCount = 0;

  const claims = await fetchClaimsForInvestigation(supabase, investigationId);
  if (claims.length === 0) {
    await deleteGraphForInvestigation(supabase, investigationId);
    return { nodesCount: 0, edgesCount: 0, pathsCount: 0, errors: [] };
  }

  const { nodes, edges } = buildGraphFromClaims(claims);
  const graphWithoutPaths: InvestigationGraph = { nodes, edges, paths: [] };
  const paths = buildPaths(graphWithoutPaths);

  await deleteGraphForInvestigation(supabase, investigationId);

  for (const node of nodes) {
    const { error } = await supabase.from('detective_nodes').insert({
      id: node.id,
      investigation_id: investigationId,
      type: node.type,
      label: node.label,
      date: node.date ?? null,
      confidence: node.confidence / 100,
    });
    if (error) errors.push(`node ${node.id}: ${error.message}`);
    else nodesCount += 1;
  }

  for (const edge of edges) {
    const { error } = await supabase.from('detective_edges').insert({
      investigation_id: investigationId,
      from_node_id: edge.from,
      to_node_id: edge.to,
      relation: edge.relation,
      strength: edge.strength,
      confidence: edge.confidence / 100,
    });
    if (error) errors.push(`edge ${edge.from}->${edge.to}: ${error.message}`);
    else edgesCount += 1;
  }

  const pathIdByIndex = new Map<number, string>();
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    const { data: inserted, error } = await supabase
      .from('detective_paths')
      .insert({
        investigation_id: investigationId,
        status: p.status,
        confidence: p.confidence,
        hypothesis_label: p.hypothesis_label ?? null,
      })
      .select('id')
      .single();
    if (error) {
      errors.push(`path ${i}: ${error.message}`);
    } else if (inserted?.id) {
      pathIdByIndex.set(i, inserted.id);
      pathsCount += 1;
    }
  }

  for (let i = 0; i < paths.length; i++) {
    const pathId = pathIdByIndex.get(i);
    if (!pathId) continue;
    const p = paths[i];
    for (let pos = 0; pos < p.nodes.length; pos++) {
      const { error } = await supabase.from('detective_path_nodes').insert({
        path_id: pathId,
        node_id: p.nodes[pos],
        position: pos,
      });
      if (error) errors.push(`path_node ${pathId}/${p.nodes[pos]}: ${error.message}`);
    }
  }

  return { nodesCount, edgesCount, pathsCount, errors };
}

/**
 * Charge le graphe (nodes, edges, paths) depuis les tables detective_* pour une enquête.
 * Retourne null si l'enquête n'existe pas ou n'a pas de nodes.
 * Convention affichage : node.confidence et path.confidence en 0..100.
 */
export async function loadGraphForInvestigation(
  supabase: SupabaseClient,
  investigationId: string
): Promise<InvestigationGraph | null> {
  const { data: inv } = await supabase
    .from('detective_investigations')
    .select('id')
    .eq('id', investigationId)
    .maybeSingle();
  if (!inv) return null;

  const [
    { data: nodesRows },
    { data: edgesRows },
    { data: pathsRows },
  ] = await Promise.all([
    supabase.from('detective_nodes').select('*').eq('investigation_id', investigationId),
    supabase.from('detective_edges').select('*').eq('investigation_id', investigationId),
    supabase.from('detective_paths').select('*').eq('investigation_id', investigationId),
  ]);

  const nodes: InvestigationGraphNode[] = (nodesRows || []).map((r: any) => ({
    id: r.id,
    type: r.type,
    label: r.label,
    date: r.date,
    confidence: Math.round((r.confidence ?? 0) * 100),
    sources: [],
  }));

  if (nodes.length === 0) return null;

  const edges: InvestigationGraphEdge[] = (edgesRows || []).map((e: any) => ({
    from: e.from_node_id,
    to: e.to_node_id,
    relation: e.relation,
    strength: e.strength,
    confidence: Math.round((e.confidence ?? 0) * 100),
  }));

  const pathIds = (pathsRows || []).map((p: any) => p.id);
  let pathNodesRows: { path_id: string; node_id: string; position: number }[] = [];
  if (pathIds.length > 0) {
    const { data } = await supabase
      .from('detective_path_nodes')
      .select('path_id, node_id, position')
      .in('path_id', pathIds)
      .order('position', { ascending: true });
    pathNodesRows = (data || []) as { path_id: string; node_id: string; position: number }[];
  }

  const pathNodeOrder = new Map<string, string[]>();
  for (const row of pathNodesRows) {
    const arr = pathNodeOrder.get(row.path_id) ?? [];
    arr.push(row.node_id);
    pathNodeOrder.set(row.path_id, arr);
  }

  const paths: InvestigationGraphPath[] = (pathsRows || []).map((p: any, i: number) => ({
    id: p.id,
    nodes: pathNodeOrder.get(p.id) ?? [],
    status: p.status,
    confidence: p.confidence ?? 0,
    hypothesis_label: p.hypothesis_label ?? undefined,
  }));

  return { nodes, edges, paths };
}

/**
 * Supprime tous les nodes, edges, paths et path_nodes pour une enquête (dans l'ordre des FK).
 */
async function deleteGraphForInvestigation(
  supabase: SupabaseClient,
  investigationId: string
): Promise<void> {
  const { data: pathIds } = await supabase
    .from('detective_paths')
    .select('id')
    .eq('investigation_id', investigationId);
  const ids = (pathIds || []).map((r: { id: string }) => r.id);
  if (ids.length > 0) {
    await supabase.from('detective_path_nodes').delete().in('path_id', ids);
  }
  await supabase.from('detective_paths').delete().eq('investigation_id', investigationId);
  await supabase.from('detective_edges').delete().eq('investigation_id', investigationId);
  await supabase.from('detective_nodes').delete().eq('investigation_id', investigationId);
}
