/**
 * Map View — radial / force-directed; same nodes and edges; click node → details.
 * See CONCEPTION_INVESTIGATION_ENGINE.md §8.3.
 */

import type { InvestigationGraph } from '../../types/investigation-graph';

interface InvestigationMapViewProps {
  graph: InvestigationGraph;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  className?: string;
}

export default function InvestigationMapView({
  graph,
  selectedNodeId,
  onNodeClick,
  className = '',
}: InvestigationMapViewProps) {
  const { nodes, edges } = graph;

  if (nodes.length === 0) {
    return (
      <div
        className={`rounded-xl border border-borders-subtle bg-background-base p-6 text-center text-text-muted text-sm ${className}`}
      >
        No nodes yet. Add signals to build the map.
      </div>
    );
  }

  // v1: simple grid layout; later: radial or force-directed
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const cellSize = 80;

  return (
    <div className={`rounded-xl border border-borders-subtle bg-background-base overflow-hidden ${className}`}>
      <div className="p-3 border-b border-borders-subtle">
        <h2 className="text-sm font-semibold text-text-primary">Map View</h2>
        <p className="text-xs text-text-muted mt-0.5">Click a node to explore. Drag to reorganize (coming).</p>
      </div>
      <div className="p-4 overflow-auto">
        <svg
          viewBox={`0 0 ${cols * cellSize} ${Math.ceil(nodes.length / cols) * cellSize}`}
          className="w-full min-h-[200px]"
        >
          {edges.map((e, i) => {
            const fromNode = nodes.find((n) => n.id === e.from);
            const toNode = nodes.find((n) => n.id === e.to);
            if (!fromNode || !toNode) return null;
            const fromIdx = nodes.indexOf(fromNode);
            const toIdx = nodes.indexOf(toNode);
            const fromCol = fromIdx % cols;
            const fromRow = Math.floor(fromIdx / cols);
            const toCol = toIdx % cols;
            const toRow = Math.floor(toIdx / cols);
            const x1 = fromCol * cellSize + cellSize / 2;
            const y1 = fromRow * cellSize + cellSize / 2;
            const x2 = toCol * cellSize + cellSize / 2;
            const y2 = toRow * cellSize + cellSize / 2;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6b7280"
                strokeWidth={1}
                strokeOpacity={0.6}
              />
            );
          })}
          {nodes.map((node, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = col * cellSize + cellSize / 2;
            const cy = row * cellSize + cellSize / 2;
            const r = 18;
            const selected = selectedNodeId === node.id;
            return (
              <g key={node.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={selected ? '#E1463E' : '#374151'}
                  stroke={selected ? '#E1463E' : '#6b7280'}
                  strokeWidth={selected ? 2 : 1}
                  className="cursor-pointer"
                  onClick={() => onNodeClick(node.id)}
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#e5e7eb"
                  className="pointer-events-none"
                >
                  {node.label.slice(0, 8)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
