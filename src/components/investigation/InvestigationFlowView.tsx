/**
 * Flow View — Left to right = time; edges as arrows; width/color = strength/confidence.
 * Same graph as Timeline and Map. See CONCEPTION_INVESTIGATION_ENGINE.md section 8.1.
 */

import type { InvestigationGraph, InvestigationGraphNode } from '../../types/investigation-graph';

export interface InvestigationFlowViewProps {
  graph: InvestigationGraph;
  selectedNodeId: string | null;
  selectedEdgeKey?: string | null;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick?: (fromId: string, toId: string) => void;
  className?: string;
}

/** Order nodes by date for flow (left → right). */
function orderNodesForFlow(nodes: InvestigationGraphNode[]): InvestigationGraphNode[] {
  return [...nodes].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

export default function InvestigationFlowView({
  graph,
  selectedNodeId,
  selectedEdgeKey = null,
  onNodeClick,
  onEdgeClick,
  className = '',
}: InvestigationFlowViewProps) {
  const { nodes, edges } = graph;

  if (nodes.length === 0) {
    return (
      <div
        className={`rounded-xl border border-borders-subtle bg-background-base p-6 text-center text-text-muted text-sm ${className}`}
      >
        No nodes yet. Add signals to build the graph.
      </div>
    );
  }

  const ordered = orderNodesForFlow(nodes);
  const edgeByFromTo = new Map<string, { to: string; strength: number; confidence: number }>();
  edges.forEach((e) => edgeByFromTo.set(e.from, { to: e.to, strength: e.strength, confidence: e.confidence }));

  return (
    <div className={`rounded-xl border border-borders-subtle bg-background-base overflow-hidden ${className}`}>
      <div className="p-3 border-b border-borders-subtle">
        <h2 className="text-sm font-semibold text-text-primary">Flow View</h2>
        <p className="text-xs text-text-muted mt-0.5">Left to right = time. Arrow thickness = strength.</p>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {ordered.map((node, i) => (
            <div key={node.id} className="flex items-center gap-0">
              <button
                type="button"
                onClick={() => onNodeClick(node.id)}
                className={`shrink-0 w-28 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
                  selectedNodeId === node.id
                    ? 'border-[#E1463E] bg-[#E1463E]/10 text-text-primary'
                    : 'border-borders-subtle bg-background-elevated hover:border-[#E1463E]/40 text-text-primary'
                }`}
              >
                <span className="font-medium truncate block">{node.label}</span>
                {node.date && (
                  <span className="block text-xs text-text-muted mt-0.5 truncate">{node.date}</span>
                )}
                <span className="block text-xs text-text-muted mt-0.5">{node.confidence} %</span>
              </button>
              {i < ordered.length - 1 && (
                <div className="shrink-0 px-1 flex items-center">
                  {edgeByFromTo.has(node.id) ? (() => {
                    const edge = edgeByFromTo.get(node.id)!;
                    const strokeW = Math.max(1, Math.round(edge.strength * 3));
                    const opacity = 0.4 + edge.strength * 0.5;
                    const edgeKey = `${node.id}|${edge.to}`;
                    const isSelected = selectedEdgeKey === edgeKey;
                    const content = (
                      <svg width="32" height="24" viewBox="0 0 32 24" className="text-[#E1463E]" aria-hidden>
                        <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth={strokeW} strokeOpacity={opacity} />
                        <path d="M 22 8 L 30 12 L 22 16 Z" fill="currentColor" opacity={opacity} />
                      </svg>
                    );
                    return onEdgeClick ? (
                      <button
                        type="button"
                        onClick={() => onEdgeClick(node.id, edge.to)}
                        className={`shrink-0 rounded p-0.5 transition-colors ${isSelected ? 'ring-2 ring-[#E1463E] ring-offset-1 ring-offset-background-base' : 'hover:bg-borders-subtle'}`}
                        title="View edge details"
                        aria-label="View edge details"
                      >
                        {content}
                      </button>
                    ) : (
                      content
                    );
                  })() : (
                    <span className="text-text-muted text-lg">→</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {edges.length > 0 && (
          <p className="text-xs text-text-muted mt-3">{edges.length} link(s) between events.</p>
        )}
      </div>
    </div>
  );
}
