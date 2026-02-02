/**
 * Shared Details Panel — same for Flow / Timeline / Map.
 * See CONCEPTION_INVESTIGATION_ENGINE.md and CONCEPTION_ENGINE_IMPLEMENTATION.md.
 */

import type { InvestigationGraph, InvestigationGraphNode } from '../../types/investigation-graph';

export interface InvestigationDetailsPanelProps {
  node: InvestigationGraphNode | null;
  graph: InvestigationGraph;
  onClose?: () => void;
  className?: string;
}

export default function InvestigationDetailsPanel({
  node,
  graph,
  onClose,
  className = '',
}: InvestigationDetailsPanelProps) {
  if (!node) {
    return (
      <div
        className={`rounded-xl border border-borders-subtle bg-background-base p-4 text-text-muted text-sm ${className}`}
      >
        Click a node to see details.
      </div>
    );
  }

  const pathsContaining = graph.paths.filter((p) => p.nodes.includes(node.id));
  const edgesOut = graph.edges.filter((e) => e.from === node.id);
  const edgesIn = graph.edges.filter((e) => e.to === node.id);

  return (
    <div
      className={`rounded-xl border border-borders-subtle bg-background-base overflow-hidden flex flex-col ${className}`}
    >
      <div className="p-4 border-b border-borders-subtle flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary truncate">{node.label}</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:bg-borders-subtle hover:text-text-primary"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {node.date && (
          <div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Date</span>
            <p className="text-sm text-text-primary">{node.date}</p>
          </div>
        )}
        <div>
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Confidence</span>
          <p className="text-sm text-text-primary">{node.confidence} %</p>
        </div>
        {node.sources.length > 0 && (
          <div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Sources</span>
            <ul className="mt-1 space-y-1">
              {node.sources.slice(0, 5).map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#E1463E] hover:underline truncate block"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {pathsContaining.length > 0 && (
          <div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Paths</span>
            <p className="text-sm text-text-primary">{pathsContaining.length} path(s)</p>
          </div>
        )}
        {(edgesIn.length > 0 || edgesOut.length > 0) && (
          <div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Relations</span>
            <p className="text-sm text-text-primary">
              {edgesIn.length} in, {edgesOut.length} out
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
