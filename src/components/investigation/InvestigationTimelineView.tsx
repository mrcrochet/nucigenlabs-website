/**
 * Timeline View — vertical timeline; events as cards with date, sources, confidence.
 * Same graph as Flow and Map. See CONCEPTION_INVESTIGATION_ENGINE.md §8.2.
 */

import type { InvestigationGraph } from '../../types/investigation-graph';

interface InvestigationTimelineViewProps {
  graph: InvestigationGraph;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  className?: string;
}

function groupNodesByDate(nodes: InvestigationGraph['nodes']): Map<string, InvestigationGraph['nodes']> {
  const byDate = new Map<string, InvestigationGraph['nodes']>();
  for (const node of nodes) {
    const key = node.date ?? 'no-date';
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(node);
  }
  for (const arr of byDate.values()) {
    arr.sort((a, b) => (a.date && b.date ? new Date(a.date).getTime() - new Date(b.date).getTime() : 0));
  }
  return byDate;
}

export default function InvestigationTimelineView({
  graph,
  selectedNodeId,
  onNodeClick,
  className = '',
}: InvestigationTimelineViewProps) {
  const { nodes } = graph;

  if (nodes.length === 0) {
    return (
      <div
        className={`rounded-xl border border-borders-subtle bg-background-base p-6 text-center text-text-muted text-sm ${className}`}
      >
        No events yet. Add signals to build the timeline.
      </div>
    );
  }

  const byDate = groupNodesByDate(nodes);
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => {
    if (a === 'no-date') return 1;
    if (b === 'no-date') return -1;
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return (
    <div className={`rounded-xl border border-borders-subtle bg-background-base overflow-hidden ${className}`}>
      <div className="p-3 border-b border-borders-subtle">
        <h2 className="text-sm font-semibold text-text-primary">Timeline View</h2>
        <p className="text-xs text-text-muted mt-0.5">Events by date.</p>
      </div>
      <div className="p-4">
        <div className="relative pl-4 border-l border-borders-subtle space-y-4">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                {dateKey === 'no-date' ? 'No date' : dateKey}
              </div>
              <div className="space-y-2">
                {(byDate.get(dateKey) ?? []).map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => onNodeClick(node.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedNodeId === node.id
                        ? 'border-[#E1463E] bg-[#E1463E]/10'
                        : 'border-borders-subtle bg-background-elevated hover:border-[#E1463E]/40'
                    }`}
                  >
                    <span className="font-medium text-text-primary block">{node.label}</span>
                    <span className="text-xs text-text-muted mt-1 block">
                      Confidence: {node.confidence} % · {node.sources.length} source(s)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
