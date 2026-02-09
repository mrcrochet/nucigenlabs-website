/**
 * Enquêtes — Workspace (cockpit). Graphe | Chronologie | Sources | Carte. Chat en drawer.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Loader2, ExternalLink, ArrowLeft, Target, Download, Clock, Eye, EyeOff, MessageSquare } from 'lucide-react';
import AppShell from '../../../components/layout/AppShell';
import SEO from '../../../components/SEO';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { sendMessage, getBrief } from '../api';
import { buildBriefingPayload, formatBriefingPayloadAsText } from '../../../lib/investigation/build-briefing';
import { DEMO_THREAD_ID } from '../demo-fixture';
import { useInvestigation } from '../hooks/useInvestigation';
import type { InvestigationGraph } from '../../../types/investigation-graph';
import type { InvestigationSignal } from '../types';
import { PathCard, TimelineView, InvestigationMap, DetailsPanel, ChatPanel, type DetailsSelection } from '../components';
import KnowledgeGraph from '../../../components/search/KnowledgeGraph';
import { investigationGraphToSearchKnowledgeGraph } from '../lib/investigation-graph-to-search';

function SourcesList({ graph, signals }: { graph: InvestigationGraph; signals: InvestigationSignal[] }) {
  const byName = new Map<string, string | undefined>();
  graph.nodes.forEach((n) => (n.sources || []).forEach((s) => byName.set(s, undefined)));
  signals.forEach((s) => {
    if (s.source) byName.set(s.source, s.url ?? undefined);
  });
  const entries = Array.from(byName.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) {
    return <p className="text-sm text-text-muted">Aucune source pour l&apos;instant.</p>;
  }
  return (
    <div className="space-y-2">
      <div className="text-xs text-text-muted mb-4">Toutes les sources ({entries.length})</div>
      {entries.map(([name, url]) =>
        url ? (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-borders-subtle p-3 rounded-lg hover:border-[#E1463E]/30 transition-colors flex items-center justify-between gap-2"
          >
            <span className="text-sm text-text-primary truncate flex-1 min-w-0">{name}</span>
            <ExternalLink className="w-3 h-3 text-text-muted shrink-0" />
          </a>
        ) : (
          <div key={name} className="border border-borders-subtle p-3 rounded-lg text-sm text-text-secondary">
            {name}
          </div>
        )
      )}
    </div>
  );
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const s = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 2592000) return `il y a ${Math.floor(s / 86400)} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function WorkspacePageContent() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useUser();
  const apiOpts = { clerkUserId: user?.id ?? undefined };

  const {
    thread,
    messages,
    signals,
    graph,
    loading,
    error,
    graphGenerating,
    graphRefreshing,
    setMessages,
    setSignals,
    refetchGraph,
    triggerGraphGenerate,
  } = useInvestigation({ threadId: threadId ?? null, apiOptions: apiOpts });

  const [selectedView, setSelectedView] = useState<'map' | 'graph' | 'timeline' | 'sources'>('map');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [showDeadPaths, setShowDeadPaths] = useState(true);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  const detailsSelection = useMemo((): DetailsSelection => {
    if (!graph) return null;
    if (selectedNodeId) {
      const node = graph.nodes.find((n) => n.id === selectedNodeId);
      return node ? { type: 'node', node } : null;
    }
    if (selectedEdgeKey) {
      const sep = selectedEdgeKey.indexOf('|');
      const from = sep >= 0 ? selectedEdgeKey.slice(0, sep) : '';
      const to = sep >= 0 ? selectedEdgeKey.slice(sep + 1) : '';
      const edge = graph.edges.find((e) => e.from === from && e.to === to);
      if (!edge) return null;
      const fromNode = graph.nodes.find((n) => n.id === edge.from);
      const toNode = graph.nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return null;
      return { type: 'edge', edge, fromNode, toNode };
    }
    if (selectedPathId) {
      const path = graph.paths.find((p) => p.id === selectedPathId);
      return path ? { type: 'path', path } : null;
    }
    return null;
  }, [graph, selectedNodeId, selectedEdgeKey, selectedPathId]);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeKey(null);
    setSelectedPathId(null);
  }, []);

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeId(id);
    setSelectedEdgeKey(null);
    setSelectedPathId(null);
  }, []);

  const handleEdgeClick = useCallback((fromId: string, toId: string) => {
    setSelectedEdgeKey(`${fromId}|${toId}`);
    setSelectedNodeId(null);
    setSelectedPathId(null);
  }, []);

  const handlePathClick = useCallback((pathId: string) => {
    setSelectedPathId(pathId);
    setSelectedNodeId(null);
    setSelectedEdgeKey(null);
  }, []);

  const handleExplorePath = useCallback((pathId: string) => {
    setSelectedPathId(pathId);
    setSelectedView('graph');
  }, []);

  const viewOrder: Array<'map' | 'graph' | 'timeline' | 'sources'> = ['map', 'graph', 'timeline', 'sources'];

  // Même Knowledge Graph que Search (D3 force-directed) ; graphe issu de la requête/hypothèse utilisateur (Tavily → buildGraph côté backend)
  const searchGraph = useMemo(() => (graph ? investigationGraphToSearchKnowledgeGraph(graph) : { nodes: [], links: [] }), [graph]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!threadId) return;
      const res = await sendMessage(threadId, { content }, apiOpts);
      if (!res.success) throw new Error(res.error);
      if (res.message) setMessages((prev) => [...prev, res.message!]);
      if (res.newSignals?.length) setSignals((prev) => [...res.newSignals!, ...prev]);
      if (threadId !== DEMO_THREAD_ID) refetchGraph();
    },
    [threadId, setMessages, setSignals, refetchGraph]
  );

  const handleExportBrief = useCallback(async () => {
    if (!threadId || !thread) return;
    if (threadId === DEMO_THREAD_ID && graph) {
      const payload = buildBriefingPayload(thread, graph);
      const text = formatBriefingPayloadAsText(payload);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brief-demo-${threadId.slice(0, 8)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const res = await getBrief(threadId, apiOpts);
    if (!res.success || !res.blob) return;
    const url = URL.createObjectURL(res.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename ?? `brief-${threadId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [threadId, thread, graph]);

  const visiblePaths = useMemo(
    () => (graph?.paths ?? []).filter((p) => showDeadPaths || p.status !== 'dead'),
    [graph, showDeadPaths]
  );
  const deadPathsCount = useMemo(() => (graph?.paths ?? []).filter((p) => p.status === 'dead').length, [graph]);
  const activePathsCount = useMemo(() => (graph?.paths ?? []).filter((p) => p.status === 'active').length, [graph]);
  const totalSources = useMemo(() => {
    const union = new Set<string>();
    if (graph) graph.nodes.forEach((n) => (n.sources || []).forEach((s) => union.add(s)));
    signals.forEach((s) => { if (s.source) union.add(s.source); });
    return union.size;
  }, [graph, signals]);

  return (
    <AppShell>
      <SEO
        title={thread ? `${thread.title || thread.initial_hypothesis} | Enquête | Nucigen Labs` : 'Enquête | Nucigen Labs'}
        description="Cockpit d'enquête : graphe, chronologie, pistes et sources."
      />
      <div className="col-span-1 sm:col-span-12 flex flex-col min-h-0">
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background-base">
          {!threadId ? (
            <div className="flex-1 flex items-center justify-center bg-background-base text-text-secondary p-6">
              <p className="text-sm">
                Sélectionnez une enquête ou <Link to="/investigations" className="text-[#E1463E] hover:underline">créez-en une</Link>.
              </p>
            </div>
          ) : loading && !thread ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-background-base p-6">
              <Loader2 className="w-8 h-8 animate-spin text-[#E1463E]" />
              <p className="text-sm text-text-secondary">Chargement de l&apos;enquête…</p>
            </div>
          ) : error || !thread ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background-base p-6">
              <p className="text-text-secondary text-sm text-center">{error || 'Piste introuvable'}</p>
              <Link to="/investigations" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E1463E]/10 text-[#E1463E] hover:bg-[#E1463E]/20 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" />
                Retour aux enquêtes
              </Link>
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-borders-subtle bg-background-elevated px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <Link to="/investigations" className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm">
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    Retour aux enquêtes
                  </Link>
                  <Link
                    to={`/investigations/${DEMO_THREAD_ID}`}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                      threadId === DEMO_THREAD_ID ? 'bg-[#E1463E]/10 text-[#E1463E] font-medium' : 'text-text-secondary hover:bg-borders-subtle hover:text-text-primary border border-borders-subtle'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    Voir la démo
                  </Link>
                </div>
                <div className="mb-3">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Enquête</div>
                  <h1 className="text-lg sm:text-xl font-semibold text-text-primary mb-2 break-words">{thread.title || thread.initial_hypothesis}</h1>
                  <p className="text-sm text-text-muted leading-relaxed max-w-3xl">
                    Pistes explorées en parallèle. Chaque piste est une hypothèse avec un niveau de preuve variable.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-text-muted">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 shrink-0" />Début {thread.created_at ? new Date(thread.created_at).toLocaleString('fr-FR') : '—'}</span>
                    <span>{totalSources} source(s)</span>
                    {graph && <span>{activePathsCount} piste(s) active(s)</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button type="button" onClick={handleExportBrief} className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-borders-subtle text-xs font-medium text-text-secondary hover:bg-borders-subtle hover:text-text-primary">
                      <Download className="w-3.5 h-3.5" /> Export Brief
                    </button>
                    <button type="button" onClick={() => setChatDrawerOpen(true)} className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-borders-subtle text-xs font-medium text-text-secondary hover:bg-borders-subtle hover:text-text-primary">
                      <MessageSquare className="w-3.5 h-3.5" /> Ouvrir Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* Layout 4/12 + 8/12 toujours visible (spéc) */}
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex-1 min-w-0 overflow-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                  {/* GAUCHE 4/12 — Pistes d'enquête (spéc) */}
                  <div className="col-span-1 lg:col-span-4 min-w-0 order-2 lg:order-1">
                    <div className="lg:sticky lg:top-6">
                      <h2 className="text-sm text-text-muted uppercase tracking-wider mb-3">
                        Pistes d&apos;enquête {graph ? `(${visiblePaths.length})` : ''}
                      </h2>
                      {graph && (
                        <button
                          type="button"
                          onClick={() => setShowDeadPaths(!showDeadPaths)}
                          className="mb-3 flex items-center gap-2 px-2 py-1.5 rounded border border-borders-subtle text-xs text-text-secondary hover:bg-borders-subtle hover:text-text-primary"
                        >
                          {showDeadPaths ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {showDeadPaths ? 'Masquer' : 'Afficher'} les pistes mortes
                        </button>
                      )}
                      <div className="space-y-0">
                        {!graph ? (
                          <div className="p-4 border border-borders-subtle rounded-lg bg-background-elevated text-sm text-text-muted">
                            {graphRefreshing || graphGenerating ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                Construction des pistes…
                              </span>
                            ) : (
                              <>
                                Aucune piste tant que le graphe n&apos;est pas généré. Lancez la collecte ou ouvrez la démo.
                                <div className="mt-3 flex flex-col gap-2">
                                  {threadId !== DEMO_THREAD_ID && (
                                    <button type="button" onClick={triggerGraphGenerate} className="w-full px-3 py-2 rounded-lg bg-[#E1463E] text-white text-xs font-medium hover:bg-[#E1463E]/90">
                                      Lancer la collecte
                                    </button>
                                  )}
                                  <Link to={`/investigations/${DEMO_THREAD_ID}`} className="w-full px-3 py-2 rounded-lg border border-borders-subtle text-text-primary text-xs font-medium hover:bg-borders-subtle text-center">
                                    Voir la démo
                                  </Link>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (graph.paths ?? []).length === 0 ? (
                          <div className="p-4 border border-borders-subtle text-sm text-text-muted">Aucune piste. Lancez la collecte.</div>
                        ) : (
                          (graph.paths ?? []).map((path) => (
                            <PathCard
                              key={path.id}
                              path={path}
                              graph={graph}
                              isSelected={selectedPathId === path.id}
                              showDeadPaths={showDeadPaths}
                              onSelect={() => setSelectedPathId(selectedPathId === path.id ? null : path.id)}
                              onExplorePath={() => handleExplorePath(path.id)}
                            />
                          ))
                        )}
                      </div>
                      {graph && !showDeadPaths && deadPathsCount > 0 && (
                        <div className="mt-3 p-3 border border-borders-subtle text-xs text-text-muted">{deadPathsCount} piste(s) morte(s) masquée(s).</div>
                      )}
                    </div>
                  </div>

                  {/* DROITE 8/12 — Réseau de preuves avec onglets (spéc) */}
                  <div className="col-span-1 lg:col-span-8 min-w-0 order-1 lg:order-2">
                    <div className="mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h2 className="text-sm text-text-muted uppercase tracking-wider">Réseau de preuves</h2>
                        <div className="flex gap-2 flex-wrap">
                          {viewOrder.map((view) => (
                            <button
                              key={view}
                              type="button"
                              onClick={() => setSelectedView(view)}
                              className={`px-3 py-2 text-xs border rounded-lg transition-colors ${selectedView === view ? 'border-[#E1463E] bg-[#E1463E]/10 text-[#E1463E]' : 'border-borders-subtle text-text-secondary hover:bg-borders-subtle hover:text-text-primary'}`}
                            >
                              {view === 'map' ? 'Carte' : view === 'graph' ? 'Graphe' : view === 'timeline' ? 'Chronologie' : 'Sources'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {(graphRefreshing || graphGenerating) && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#E1463E]/5 border border-borders-subtle rounded-lg text-sm text-text-secondary mb-4">
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          {graphGenerating ? 'Génération du graphe en cours…' : 'Mise à jour du graphe…'}
                        </div>
                      )}

                      {graph && selectedView === 'map' && (
                        <div className="flex-1 min-h-0 overflow-auto p-4 rounded-xl border border-borders-subtle bg-background-elevated">
                          <InvestigationMap
                            graph={graph}
                            selectedPathId={selectedPathId}
                            onNodeClick={handleNodeClick}
                          />
                        </div>
                      )}
                      {!graph && (
                        <div className="flex items-center justify-center min-h-[280px] px-4 py-8 rounded-xl border border-borders-subtle bg-background-elevated">
                          <div className="max-w-md w-full text-center">
                            {graphRefreshing || graphGenerating ? (
                              <>
                                <Loader2 className="w-12 h-12 animate-spin text-[#E1463E] mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-text-primary mb-2">Construction des pistes…</h3>
                                <p className="text-sm text-text-muted">Tavily → Knowledge Graph → pistes.</p>
                              </>
                            ) : (
                              <>
                                <h3 className="text-lg font-semibold text-text-primary mb-2">Aucun graphe pour l&apos;instant</h3>
                                <p className="text-sm text-text-muted mb-4">Lancez la collecte pour générer les pistes et le réseau de preuves.</p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                  {threadId !== DEMO_THREAD_ID && (
                                    <button type="button" onClick={triggerGraphGenerate} className="px-4 py-2 rounded-lg bg-[#E1463E] text-white text-sm font-medium hover:bg-[#E1463E]/90">
                                      Lancer la collecte
                                    </button>
                                  )}
                                  <Link to={`/investigations/${DEMO_THREAD_ID}`} className="px-4 py-2 rounded-lg border border-borders-subtle text-text-primary text-sm font-medium hover:bg-borders-subtle text-center">
                                    Voir la démo
                                  </Link>
                                  <button type="button" onClick={() => setChatDrawerOpen(true)} className="px-4 py-2 rounded-lg border border-borders-subtle text-text-primary text-sm font-medium hover:bg-borders-subtle">
                                    Ouvrir Chat
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {graph && selectedView === 'graph' && (
                        <div className="flex-1 min-h-[400px] overflow-auto p-4 rounded-xl border border-borders-subtle bg-background-elevated">
                          <KnowledgeGraph
                            graph={searchGraph}
                            onNodeClick={handleNodeClick}
                            focusNodeId={selectedNodeId}
                            height={420}
                          />
                        </div>
                      )}
                      {graph && selectedView === 'timeline' && (
                        <div className="flex-1 min-h-0 overflow-auto p-4 rounded-xl border border-borders-subtle bg-background-elevated">
                          <TimelineView
                            graph={graph}
                            selectedNodeId={selectedNodeId}
                            selectedPathId={selectedPathId}
                            showDeadPaths={showDeadPaths}
                            onNodeClick={handleNodeClick}
                            onPathClick={handlePathClick}
                          />
                        </div>
                      )}
                      {graph && selectedView === 'sources' && (
                        <div className="flex-1 min-h-0 overflow-auto p-4 rounded-xl border border-borders-subtle bg-background-elevated">
                          <SourcesList graph={graph} signals={signals} />
                        </div>
                      )}
                      {graph && detailsSelection && (
                        <div className="mt-4 border border-borders-subtle bg-background-elevated rounded-xl p-4">
                          <DetailsPanel selection={detailsSelection} graph={graph} onClose={clearSelection} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {threadId && thread && chatDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => setChatDrawerOpen(false)} />
            <div className="relative w-full max-w-md bg-background-base border-l border-borders-subtle shadow-xl flex flex-col max-h-full">
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-borders-subtle">
                <h2 className="text-sm font-semibold text-text-primary">Chat</h2>
                <button type="button" onClick={() => setChatDrawerOpen(false)} className="p-2 rounded-lg text-text-secondary hover:bg-borders-subtle hover:text-text-primary" aria-label="Fermer">✕</button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatPanel
                  threadId={threadId}
                  initialHypothesis={thread.initial_hypothesis}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  loading={loading}
                  readOnly={threadId === DEMO_THREAD_ID}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function WorkspacePage() {
  return (
    <ProtectedRoute>
      <WorkspacePageContent />
    </ProtectedRoute>
  );
}
