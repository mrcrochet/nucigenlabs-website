/**
 * Entity Details Drawer
 *
 * Slide-over drawer for graph entity nodes: name, type, confidence,
 * results where the entity appears, and graph links involving this entity.
 */

import { X, FileText, Link2 } from 'lucide-react';
import type { GraphNode, KnowledgeGraph, SearchResult } from '../../types/search';

interface EntityDetailsDrawerProps {
  entityNode: GraphNode;
  results: SearchResult[];
  graph: KnowledgeGraph;
  isOpen: boolean;
  onClose: () => void;
}

function getNodeLabelById(graph: KnowledgeGraph, id: string): string {
  const node = graph.nodes.find((n) => n.id === id);
  return node?.label ?? id;
}

export default function EntityDetailsDrawer({
  entityNode,
  results,
  graph,
  isOpen,
  onClose,
}: EntityDetailsDrawerProps) {
  if (!isOpen) return null;

  const resultsWhereEntityAppears = results.filter((r) =>
    r.entities.some((e) => e.id === entityNode.id)
  );
  const linksInvolvingEntity = graph.links.filter(
    (l) => l.source === entityNode.id || l.target === entityNode.id
  );

  const confidence = entityNode.confidence ?? 0;
  const confidencePct = Math.round(confidence * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-background-base border-l border-borders-subtle shadow-xl overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-text-primary mb-1">{entityNode.label}</h2>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <span className="capitalize">{entityNode.type.replace('_', ' ')}</span>
                <span>Confiance : {confidencePct}%</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background-glass-subtle rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {resultsWhereEntityAppears.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Résultats où cette entité apparaît
              </h3>
              <ul className="space-y-2">
                {resultsWhereEntityAppears.slice(0, 10).map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline line-clamp-2"
                    >
                      {r.title}
                    </a>
                    <span className="text-xs text-text-muted ml-1">{r.source}</span>
                  </li>
                ))}
                {resultsWhereEntityAppears.length > 10 && (
                  <li className="text-xs text-text-muted">
                    + {resultsWhereEntityAppears.length - 10} autres
                  </li>
                )}
              </ul>
            </div>
          )}

          {linksInvolvingEntity.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Liens dans le graphe
              </h3>
              <ul className="space-y-1.5">
                {linksInvolvingEntity.map((link, idx) => {
                  const otherId = link.source === entityNode.id ? link.target : link.source;
                  const otherLabel = getNodeLabelById(graph, otherId);
                  const direction =
                    link.source === entityNode.id ? '→' : '←';
                  return (
                    <li
                      key={`${link.source}-${link.target}-${link.type}-${idx}`}
                      className="text-sm text-text-secondary"
                    >
                      <span className="text-text-primary">{entityNode.label}</span>
                      <span className="mx-1">{direction}</span>
                      <span className="text-accent font-medium">{link.type.replace('_', ' ')}</span>
                      <span className="mx-1">{direction}</span>
                      <span className="text-text-primary">{otherLabel}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {resultsWhereEntityAppears.length === 0 && linksInvolvingEntity.length === 0 && (
            <p className="text-sm text-text-muted">
              Aucun résultat ou lien associé pour cette entité dans le graphe actuel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
