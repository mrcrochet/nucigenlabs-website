/**
 * Shared Details Panel — Step 3. Same for Flow / Timeline / Map.
 * Explains; does not narrate. No chat, no conclusions, no long text.
 * See docs/SCHEMA_INVESTIGATION_ENGINE.md and Step 3 spec.
 */

import type {
  InvestigationGraph,
  InvestigationGraphNode,
  InvestigationGraphEdge,
  InvestigationGraphPath,
} from '../../types/investigation-graph';

export type DetailsSelection =
  | { type: 'node'; node: InvestigationGraphNode }
  | { type: 'edge'; edge: InvestigationGraphEdge; fromNode: InvestigationGraphNode; toNode: InvestigationGraphNode }
  | { type: 'path'; path: InvestigationGraphPath }
  | null;

export interface InvestigationDetailsPanelProps {
  selection: DetailsSelection;
  graph: InvestigationGraph;
  onClose?: () => void;
  className?: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-medium text-text-secondary uppercase tracking-wider block mb-1">{title}</span>
      {children}
    </div>
  );
}

/** Node details: label, type, date, confidence, sources, paths (status+confidence), in/out edges */
function NodeDetails({
  node,
  graph,
  onClose,
  className = '',
}: {
  node: InvestigationGraphNode;
  graph: InvestigationGraph;
  onClose?: () => void;
  className?: string;
}) {
  const pathsContaining = graph.paths.filter((p) => p.nodes.includes(node.id));
  const edgesOut = graph.edges.filter((e) => e.from === node.id);
  const edgesIn = graph.edges.filter((e) => e.to === node.id);
  const toNode = (id: string) => graph.nodes.find((n) => n.id === id);
  const fromNode = (id: string) => graph.nodes.find((n) => n.id === id);

  return (
    <div className={`rounded-xl border border-borders-subtle bg-background-base overflow-hidden flex flex-col ${className}`}>
      <div className="p-4 border-b border-borders-subtle flex items-center justify-between shrink-0">
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
      <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
        <Section title="Type">
          <p className="text-sm text-text-primary">{node.type}</p>
        </Section>
        {node.date && (
          <Section title="Date">
            <p className="text-sm text-text-primary">{node.date}</p>
          </Section>
        )}
        <Section title="Confidence">
          <p className="text-sm text-text-primary">{node.confidence} %</p>
        </Section>
        {node.sources.length > 0 && (
          <Section title="Sources">
            <ul className="space-y-1">
              {node.sources.slice(0, 8).map((url, i) => (
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
          </Section>
        )}
        {pathsContaining.length > 0 && (
          <Section title="Paths using this node">
            <ul className="space-y-1.5">
              {pathsContaining.map((p) => (
                <li key={p.id} className="text-sm">
                  <span className="text-text-primary font-medium">{p.hypothesis_label || p.id}</span>
                  <span className="text-text-muted ml-1">
                    {p.status} · {p.confidence} %
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {(edgesIn.length > 0 || edgesOut.length > 0) && (
          <Section title="Relations">
            {edgesIn.length > 0 && (
              <p className="text-xs text-text-muted mb-1">Incoming ({edgesIn.length})</p>
            )}
            <ul className="space-y-0.5 mb-2">
              {edgesIn.slice(0, 5).map((e, i) => {
                const from = fromNode(e.from);
                return (
                  <li key={i} className="text-sm text-text-secondary">
                    {from?.label ?? e.from} → <span className="text-text-primary">{node.label}</span>
                    <span className="text-text-muted ml-1">{e.relation}</span>
                  </li>
                );
              })}
            </ul>
            {edgesOut.length > 0 && <p className="text-xs text-text-muted mb-1">Outgoing ({edgesOut.length})</p>}
            <ul className="space-y-0.5">
              {edgesOut.slice(0, 5).map((e, i) => {
                const to = toNode(e.to);
                return (
                  <li key={i} className="text-sm text-text-secondary">
                    <span className="text-text-primary">{node.label}</span> → {to?.label ?? e.to}
                    <span className="text-text-muted ml-1">{e.relation}</span>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

/** Edge details: relation, strength, confidence, connected nodes, affected paths */
function EdgeDetails({
  edge,
  fromNode,
  toNode,
  graph,
  onClose,
  className = '',
}: {
  edge: InvestigationGraphEdge;
  fromNode: InvestigationGraphNode;
  toNode: InvestigationGraphNode;
  graph: InvestigationGraph;
  onClose?: () => void;
  className?: string;
}) {
  const pathsUsing = graph.paths.filter((p) => {
    const idxFrom = p.nodes.indexOf(edge.from);
    const idxTo = p.nodes.indexOf(edge.to);
    return idxFrom >= 0 && idxTo >= 0 && idxTo === idxFrom + 1;
  });

  return (
    <div className={`rounded-xl border border-borders-subtle bg-background-base overflow-hidden flex flex-col ${className}`}>
      <div className="p-4 border-b border-borders-subtle flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-text-primary truncate">
          {fromNode.label} → {toNode.label}
        </h3>
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
      <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
        <Section title="Relation">
          <p className="text-sm text-text-primary">{edge.relation}</p>
        </Section>
        <Section title="Strength">
          <p className="text-sm text-text-primary">{Math.round(edge.strength * 100)} %</p>
        </Section>
        <Section title="Confidence">
          <p className="text-sm text-text-primary">{edge.confidence} %</p>
        </Section>
        <Section title="Connected nodes">
          <p className="text-sm text-text-primary">
            {fromNode.label} (from) · {toNode.label} (to)
          </p>
        </Section>
        {pathsUsing.length > 0 && (
          <Section title="Paths using this edge">
            <ul className="space-y-1.5">
              {pathsUsing.map((p) => (
                <li key={p.id} className="text-sm">
                  <span className="text-text-primary font-medium">{p.hypothesis_label || p.id}</span>
                  <span className="text-text-muted ml-1">{p.status} · {p.confidence} %</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

/** Path details: hypothesis_label, status, confidence, ordered nodes, reason weak/dead if applicable */
function PathDetails({
  path,
  graph,
  onClose,
  className = '',
}: {
  path: InvestigationGraphPath;
  graph: InvestigationGraph;
  onClose?: () => void;
  className?: string;
}) {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const orderedNodes = path.nodes.map((id) => nodeMap.get(id)).filter(Boolean) as InvestigationGraphNode[];
  const isWeakOrDead = path.status === 'weak' || path.status === 'dead';
  const reasonText =
    path.status === 'dead'
      ? 'Path invalidated by contradictory or solid counter-evidence.'
      : path.status === 'weak'
        ? 'Path not confirmed: insufficient or conflicting evidence.'
        : null;

  return (
    <div className={`rounded-xl border border-borders-subtle bg-background-base overflow-hidden flex flex-col ${className}`}>
      <div className="p-4 border-b border-borders-subtle flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-text-primary truncate">
          {path.hypothesis_label || path.id}
        </h3>
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
      <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
        <Section title="Status">
          <p className="text-sm text-text-primary capitalize">{path.status}</p>
        </Section>
        <Section title="Confidence">
          <p className="text-sm text-text-primary">{path.confidence} %</p>
        </Section>
        {orderedNodes.length > 0 && (
          <Section title="Ordered nodes">
            <ol className="list-decimal list-inside space-y-0.5 text-sm text-text-primary">
              {orderedNodes.map((n) => (
                <li key={n.id}>{n.label}</li>
              ))}
            </ol>
          </Section>
        )}
        {isWeakOrDead && reasonText && (
          <Section title="Why this path is weak or dead">
            <p className="text-sm text-text-secondary">{reasonText}</p>
          </Section>
        )}
      </div>
    </div>
  );
}

export default function InvestigationDetailsPanel({
  selection,
  graph,
  onClose,
  className = '',
}: InvestigationDetailsPanelProps) {
  if (!selection) {
    return (
      <div
        className={`rounded-xl border border-borders-subtle bg-background-base p-4 text-text-muted text-sm ${className}`}
      >
        Click a node, edge, or path to see details.
      </div>
    );
  }

  if (selection.type === 'node') {
    return <NodeDetails node={selection.node} graph={graph} onClose={onClose} className={className} />;
  }
  if (selection.type === 'edge') {
    return (
      <EdgeDetails
        edge={selection.edge}
        fromNode={selection.fromNode}
        toNode={selection.toNode}
        graph={graph}
        onClose={onClose}
        className={className}
      />
    );
  }
  return <PathDetails path={selection.path} graph={graph} onClose={onClose} className={className} />;
}
