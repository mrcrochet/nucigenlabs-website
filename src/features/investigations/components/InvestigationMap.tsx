/**
 * Investigation Map — Mapbox map reusing GlobalSituationMap logic.
 * Converts investigation nodes (with lat/lon) to OverviewSignal[]; filters by type, halo, click → onNodeClick.
 */

import { useMemo, useCallback } from 'react';
import type { InvestigationGraph } from '../../../types/investigation-graph';
import type { InvestigationNodeType } from '../../../types/investigation-graph';
import type { OverviewSignal, OverviewSignalType, OverviewSignalImpact } from '../../../types/overview';
import GlobalSituationMap from '../../../components/overview/GlobalSituationMap';

const NODE_TYPE_TO_MAP_TYPE: Record<InvestigationNodeType, OverviewSignalType> = {
  event: 'geopolitics',
  actor: 'security',
  resource: 'supply-chains',
  decision: 'geopolitics',
  impact: 'energy',
};

function confidenceToImpact(confidence: number): OverviewSignalImpact {
  if (confidence >= 75) return 'global';
  if (confidence >= 50) return 'regional';
  return 'local';
}

function investigationNodesToSignals(graph: InvestigationGraph): OverviewSignal[] {
  return graph.nodes
    .filter((n): n is typeof n & { lat: number; lon: number } =>
      typeof n.lat === 'number' && typeof n.lon === 'number'
    )
    .map((n) => ({
      id: n.id,
      lat: n.lat,
      lon: n.lon,
      type: NODE_TYPE_TO_MAP_TYPE[n.type],
      impact: confidenceToImpact(n.confidence),
      importance: n.confidence,
      confidence: n.confidence,
      occurred_at: n.date || new Date().toISOString(),
      label_short: n.label,
      subtitle_short: n.type,
      impact_one_line: `${n.label} (${n.confidence}%)`,
      investigate_id: null,
    }));
}

export interface InvestigationMapProps {
  graph: InvestigationGraph;
  selectedPathId?: string | null;
  onNodeClick: (nodeId: string) => void;
  /** Optional: when set, only nodes belonging to this path are shown */
  filterByPathId?: boolean;
}

export default function InvestigationMap({
  graph,
  onNodeClick,
  filterByPathId = false,
  selectedPathId = null,
}: InvestigationMapProps) {
  const pathNodeIds = useMemo(() => {
    if (!filterByPathId || !selectedPathId) return null;
    const path = graph.paths.find((p) => p.id === selectedPathId);
    return path ? new Set(path.nodes) : null;
  }, [graph.paths, selectedPathId, filterByPathId]);

  const signals = useMemo(() => {
    const list = investigationNodesToSignals(graph);
    if (pathNodeIds) return list.filter((s) => pathNodeIds.has(s.id));
    return list;
  }, [graph, pathNodeIds]);

  const handleSignalClick = useCallback(
    (signal: OverviewSignal) => onNodeClick(signal.id),
    [onNodeClick]
  );

  if (signals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-xl border border-borders-subtle bg-background-elevated text-text-muted text-sm">
        {graph.nodes.some((n) => n.lat != null && n.lon != null)
          ? 'Aucun nœud avec coordonnées dans cette sélection.'
          : 'Aucun nœud avec coordonnées. Ajoutez lat/lon aux nœuds pour afficher la carte.'}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-borders-subtle bg-background-elevated">
      <GlobalSituationMap
        signals={signals}
        defaultLayers={['geopolitics', 'supply-chains', 'markets', 'energy', 'security']}
        onSignalClick={handleSignalClick}
      />
    </div>
  );
}
