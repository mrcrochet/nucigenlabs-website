/**
 * Path card for cockpit: status, hypothesis, confidence, key nodes, evidence.
 */

import { CheckCircle, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
import type {
  InvestigationGraph,
  InvestigationGraphPath,
  InvestigationGraphNode,
  PathEvidence,
} from '../../../types/investigation-graph';

function getStatusColor(status: 'active' | 'weak' | 'dead'): string {
  if (status === 'active') return 'border-gray-600 bg-gray-900/50';
  if (status === 'weak') return 'border-gray-700 bg-gray-900/30';
  return 'border-gray-800 bg-gray-900/20';
}

function getConfidenceBarColor(status: 'active' | 'weak' | 'dead'): string {
  if (status === 'active') return 'bg-gray-400';
  if (status === 'weak') return 'bg-gray-600';
  return 'bg-gray-700';
}

export interface PathCardProps {
  path: InvestigationGraphPath;
  graph: InvestigationGraph;
  isSelected: boolean;
  showDeadPaths: boolean;
  onSelect: () => void;
  onExplorePath: () => void;
}

export default function PathCard({
  path,
  graph,
  isSelected,
  showDeadPaths,
  onSelect,
  onExplorePath,
}: PathCardProps) {
  const isVisible = showDeadPaths || path.status !== 'dead';
  if (!isVisible) return null;

  const pathNodeSet = new Set(path.nodes);
  const edgeCount = graph.edges.filter((e) => pathNodeSet.has(e.from) && pathNodeSet.has(e.to)).length;
  const keyNodesList =
    (path.keyNodes?.length ?? 0) > 0
      ? (path.keyNodes!.map((kn) => graph.nodes.find((n) => n.id === kn.id)).filter(Boolean) as InvestigationGraphNode[])
      : (path.nodes
          .map((id) => graph.nodes.find((n) => n.id === id))
          .filter(Boolean) as InvestigationGraphNode[]);
  const evidenceItems: PathEvidence[] =
    (path.evidence?.length ?? 0) > 0
      ? path.evidence
      : (path.nodes
          .map((id) => graph.nodes.find((n) => n.id === id))
          .filter(Boolean) as InvestigationGraphNode[])
          .flatMap((n) => (n.sources || []).map((source) => ({ source, confidence: 'medium' as const })));

  const statusLabel =
    path.status === 'active' ? 'Piste active' : path.status === 'weak' ? 'Piste faible' : 'Piste morte';

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`border p-4 mb-3 cursor-pointer transition-all touch-manipulation min-h-[44px] ${getStatusColor(path.status)} ${
        isSelected ? 'border-gray-500' : ''
      } ${path.status === 'dead' ? 'opacity-40' : ''}`}
      onClick={() => onSelect()}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {path.status === 'active' && <CheckCircle className="w-4 h-4 text-gray-400 shrink-0" />}
            {path.status === 'weak' && <AlertCircle className="w-4 h-4 text-gray-500 shrink-0" />}
            {path.status === 'dead' && <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}
            <span className="text-xs text-gray-500 uppercase tracking-wider">{statusLabel}</span>
            <span className="text-xs text-gray-600 font-mono">{path.confidence}%</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-300 leading-snug mb-2">
            {path.hypothesis_label || path.id}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
            <span>{path.nodes.length} nœuds</span>
            <span>•</span>
            <span>{edgeCount} liens</span>
            {path.lastUpdate && (
              <>
                <span>•</span>
                <span>MAJ {path.lastUpdate}</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-gray-600 shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`}
        />
      </div>

      <div className="mb-2">
        <div className="h-1 bg-gray-800 overflow-hidden">
          <div
            className={`h-1 transition-all ${getConfidenceBarColor(path.status)}`}
            style={{ width: `${Math.min(100, path.confidence)}%` }}
          />
        </div>
      </div>

      {isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Éléments clés ({keyNodesList.length})
            </h4>
            <div className="space-y-1">
              {keyNodesList.slice(0, 8).map((node) => (
                <div key={node.id} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-gray-600 capitalize shrink-0">{node.type}</span>
                  <span className="text-gray-400 truncate">{node.label}</span>
                </div>
              ))}
              {keyNodesList.length > 8 && (
                <div className="text-xs text-gray-600">+{keyNodesList.length - 8} autres</div>
              )}
            </div>
          </div>

          {evidenceItems.length > 0 && (
            <div>
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Preuves / Sources ({evidenceItems.length})
              </h4>
              <div className="space-y-1.5">
                {evidenceItems.slice(0, 6).map((e, idx) => (
                  <div key={idx} className="text-xs">
                    {e.text && <div className="text-gray-400 mb-0.5">{e.text}</div>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-500 truncate" title={e.source}>
                        {e.source}
                      </span>
                      <span className="text-gray-600 capitalize shrink-0">({e.confidence})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {path.contradictions?.length ? (
            <div>
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Contradictions
              </h4>
              <ul className="space-y-1 list-disc list-inside text-xs text-gray-500">
                {path.contradictions.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExplorePath();
            }}
            className="w-full px-3 py-2 border border-gray-700 text-gray-400 text-xs hover:bg-gray-800 transition-colors"
          >
            Explorer cette piste →
          </button>
        </div>
      )}
    </div>
  );
}
