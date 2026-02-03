/**
 * Investigation Workspace Page — Intelligence Detective
 * 3 colonnes : liste des pistes (gauche), feed des signaux + chat (centre), panel intelligence (droite).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Loader2, FileSearch, ExternalLink, ArrowLeft, Target, AlertTriangle, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import { getThreads, getThread, getDetectiveGraph, sendMessage, getBrief } from '../lib/api/investigation-api';
import { buildGraphFromSignals } from '../lib/investigation/build-graph';
import { buildBriefingPayload, formatBriefingPayloadAsText } from '../lib/investigation/build-briefing';
import { DEMO_THREAD_ID, getDemoGraphFixture, DEMO_THREAD_PAYLOAD } from '../lib/investigation/demo-graph-fixture';
import InvestigationChatPanel from '../components/investigation/InvestigationChatPanel';
import InvestigationBriefingView from '../components/investigation/InvestigationBriefingView';
import InvestigationFlowView from '../components/investigation/InvestigationFlowView';
import InvestigationTimelineView from '../components/investigation/InvestigationTimelineView';
import InvestigationMapView from '../components/investigation/InvestigationMapView';
import InvestigationDetailsPanel, { type DetailsSelection } from '../components/investigation/InvestigationDetailsPanel';
import type {
  InvestigationThread,
  InvestigationSignal,
  InvestigationMessage,
} from '../types/investigation';
import type { InvestigationGraph } from '../types/investigation-graph';

const ASSESSMENT_LABELS: Record<string, string> = {
  supported: 'Confirmée',
  partially_supported: 'Partiellement confirmée',
  unclear: 'Incertaine',
  contradicted: 'Contredite',
};

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const s = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return 'à l\'instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 2592000) return `il y a ${Math.floor(s / 86400)} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function InvestigationWorkspaceContent() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [threads, setThreads] = useState<InvestigationThread[]>([]);
  const [thread, setThread] = useState<InvestigationThread | null>(null);
  const [messages, setMessages] = useState<InvestigationMessage[]>([]);
  const [signals, setSignals] = useState<InvestigationSignal[]>([]);
  const [detectiveGraph, setDetectiveGraph] = useState<InvestigationGraph | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingThread, setLoadingThread] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'signals' | 'flow' | 'timeline' | 'map' | 'briefing'>('signals');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [showDeadPaths, setShowDeadPaths] = useState(true);

  const graph = useMemo(() => {
    if (!thread) return null;
    if (thread.id === DEMO_THREAD_ID) return getDemoGraphFixture();
    if (detectiveGraph) return detectiveGraph;
    if (!signals.length) return null;
    return buildGraphFromSignals(thread, signals);
  }, [thread, signals, detectiveGraph]);

  const briefingPayload = useMemo(() => {
    if (!thread || !graph) return null;
    return buildBriefingPayload(thread, graph);
  }, [thread, graph]);

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

  const apiOpts = { clerkUserId: user?.id ?? undefined };

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    const res = await getThreads(apiOpts);
    if (res.success && res.threads) setThreads(res.threads);
    setLoadingThreads(false);
  }, [user?.id]);

  const loadThread = useCallback(
    async (id: string) => {
      setLoadingThread(true);
      setError(null);
      const res = await getThread(id, apiOpts);
      if (res.success && res.thread) {
        setThread(res.thread);
        setMessages(res.messages ?? []);
        setSignals(res.signals ?? []);
        if (id !== DEMO_THREAD_ID) {
          const graphRes = await getDetectiveGraph(id, apiOpts);
          setDetectiveGraph(graphRes.success && graphRes.graph ? graphRes.graph : null);
        } else {
          setDetectiveGraph(null);
        }
      } else {
        setError(res.error || 'Piste introuvable');
        setThread(null);
        setMessages([]);
        setSignals([]);
        setDetectiveGraph(null);
      }
      setLoadingThread(false);
    },
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id) return;
    loadThreads();
  }, [loadThreads, user?.id]);

  useEffect(() => {
    if (!threadId || !user?.id) return;
    loadThread(threadId);
  }, [threadId, loadThread, user?.id]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!threadId) return;
      const res = await sendMessage(threadId, { content }, apiOpts);
      if (!res.success) throw new Error(res.error);
      if (res.message) setMessages((prev) => [...prev, res.message!]);
      if (res.newSignals && res.newSignals.length > 0) {
        setSignals((prev) => [...res.newSignals!, ...prev]);
      }
      if (threadId !== DEMO_THREAD_ID) {
        const graphRes = await getDetectiveGraph(threadId, apiOpts);
        if (graphRes.success && graphRes.graph) setDetectiveGraph(graphRes.graph);
      }
    },
    [threadId, user?.id]
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
  }, [threadId, thread, graph, user?.id]);

  const loading = loadingThread;

  return (
    <AppShell>
      <SEO title={thread ? `${thread.title} | Enquête | Nucigen Labs` : 'Enquête | Intelligence Detective | Nucigen Labs'} />
      <div className="col-span-1 sm:col-span-12 flex">
        {/* Gauche — Liste des pistes */}
        <aside className="w-64 shrink-0 border-r border-borders-subtle bg-background-base flex flex-col min-h-[calc(100vh-64px)]">
          <div className="px-3 py-3 border-b border-borders-subtle">
            <div className="flex items-center gap-2 mb-1">
              <FileSearch className="w-5 h-5 text-[#E1463E] shrink-0" />
              <span className="text-sm font-semibold text-text-primary">Enquêtes</span>
            </div>
            <p className="text-[10px] text-text-secondary leading-tight italic">
              The only platform that shows you HOW events are connected, not just that they are.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <Link
              to="/investigations"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:bg-borders-subtle hover:text-text-primary text-sm mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Toutes les enquêtes
            </Link>
            <Link
              to={`/investigations/${DEMO_THREAD_ID}`}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm mb-2 transition-colors ${
                threadId === DEMO_THREAD_ID ? 'bg-[#E1463E]/10 text-[#E1463E] font-medium' : 'bg-[#E1463E]/5 text-[#E1463E] hover:bg-[#E1463E]/10 border border-[#E1463E]/30'
              }`}
            >
              <Target className="w-4 h-4 shrink-0" />
              Voir la démo analyste
            </Link>
            {loadingThreads ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
              </div>
            ) : (
              <ul className="space-y-1">
                {threads.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/investigations/${t.id}`}
                      className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        t.id === threadId
                          ? 'bg-[#E1463E]/10 text-[#E1463E] font-medium'
                          : 'text-text-secondary hover:bg-borders-subtle hover:text-text-primary'
                      }`}
                    >
                      <span className="block truncate">{t.title}</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                        {t.confidence_score != null && (
                          <span title="Confiance">
                            {t.confidence_score >= 0 && t.confidence_score <= 100
                              ? `${t.confidence_score} %`
                              : `${Math.round(Number(t.confidence_score) * 100)} %`}
                          </span>
                        )}
                        <span>{relativeTime(t.updated_at)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Centre — Feed signaux + Chat */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background-base">
          {!threadId ? (
            <div className="flex-1 flex items-center justify-center bg-background-base text-text-secondary p-6">
              <p className="text-sm">Sélectionnez une enquête ou <Link to="/investigations" className="text-[#E1463E] hover:underline">créez-en une</Link>.</p>
            </div>
          ) : loading && !thread ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-background-base p-6">
              <Loader2 className="w-8 h-8 animate-spin text-[#E1463E]" />
              <p className="text-sm text-text-secondary">Chargement de l'enquête…</p>
            </div>
          ) : error || !thread ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background-base p-6">
              <p className="text-text-secondary text-sm text-center">{error || 'Piste introuvable'}</p>
              <Link
                to="/investigations"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E1463E]/10 text-[#E1463E] hover:bg-[#E1463E]/20 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour aux enquêtes
              </Link>
            </div>
          ) : (
            <>
              {/* Tabs: Signals | Flow | Timeline | Map | Briefing */}
              <div className="shrink-0 border-b border-borders-subtle bg-background-elevated px-4 py-2 flex gap-1 flex-wrap">
                {(['signals', 'flow', 'timeline', 'map', 'briefing'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === mode ? 'bg-[#E1463E]/10 text-[#E1463E]' : 'text-text-secondary hover:bg-borders-subtle hover:text-text-primary'
                    }`}
                  >
                    {mode === 'signals' ? 'Signals' : mode === 'flow' ? 'Flow' : mode === 'timeline' ? 'Timeline' : mode === 'map' ? 'Map' : 'Briefing'}
                  </button>
                ))}
              </div>
              <div className="flex flex-col bg-background-base flex-1 min-h-0">
                {viewMode === 'signals' && (
                  <div className="p-4 space-y-3 overflow-y-auto">
                  {signals.length === 0 && (
                    <p className="text-text-secondary text-sm py-4">Aucun signal pour l’instant. Envoyez un message dans le chat pour lancer la collecte.</p>
                  )}
                  {signals.map((sig) => (
                    <div
                      key={sig.id}
                      className="rounded-lg border border-borders-subtle bg-background-base p-3 space-y-2 hover:border-[#E1463E]/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-text-secondary uppercase">{sig.type}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {sig.impact_on_hypothesis === 'supports' && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-500" title="Renforce l'hypothèse">
                              <TrendingUp className="w-3.5 h-3.5" />
                              +
                            </span>
                          )}
                          {sig.impact_on_hypothesis === 'weakens' && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-500" title="Affaiblit l'hypothèse">
                              <TrendingDown className="w-3.5 h-3.5" />
                              −
                            </span>
                          )}
                          {sig.impact_on_hypothesis === 'neutral' && (
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted" title="Neutre">
                              <Minus className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {sig.url && (
                            <a
                              href={sig.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-[#E1463E] hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Lire
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-text-primary">{sig.source}</p>
                      <p className="text-xs text-text-secondary line-clamp-2">{sig.summary}</p>
                      {sig.date && (
                        <p className="text-xs text-text-muted">{new Date(sig.date).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                  ))}
                  </div>
                )}
                {viewMode === 'flow' && graph && (
                  <div className="flex-1 min-h-0 overflow-auto p-4">
                    <InvestigationFlowView
                      graph={graph}
                      selectedNodeId={selectedNodeId}
                      selectedEdgeKey={selectedEdgeKey}
                      selectedPathId={selectedPathId}
                      showDeadPaths={showDeadPaths}
                      onNodeClick={handleNodeClick}
                      onEdgeClick={handleEdgeClick}
                      onPathClick={handlePathClick}
                    />
                  </div>
                )}
                {viewMode === 'timeline' && graph && (
                  <div className="flex-1 min-h-0 overflow-auto p-4">
                    <InvestigationTimelineView
                      graph={graph}
                      selectedNodeId={selectedNodeId}
                      selectedPathId={selectedPathId}
                      showDeadPaths={showDeadPaths}
                      onNodeClick={handleNodeClick}
                      onPathClick={handlePathClick}
                    />
                  </div>
                )}
                {viewMode === 'map' && graph && (
                  <div className="flex-1 min-h-0 overflow-auto p-4">
                    <InvestigationMapView
                      graph={graph}
                      selectedNodeId={selectedNodeId}
                      selectedPathId={selectedPathId}
                      showDeadPaths={showDeadPaths}
                      onNodeClick={handleNodeClick}
                      onPathClick={handlePathClick}
                    />
                  </div>
                )}
                {viewMode === 'briefing' && (
                  <div className="flex-1 min-h-0 overflow-auto p-4">
                    {briefingPayload ? (
                      <InvestigationBriefingView
                        payload={briefingPayload}
                        onPathClick={handlePathClick}
                      />
                    ) : (
                      <div className="rounded-xl border border-borders-subtle bg-background-base p-6 text-center text-text-muted text-sm">
                        Add signals to build the graph and see the briefing.
                      </div>
                    )}
                  </div>
                )}
                {/* Chat */}
                <div className="shrink-0 h-[320px] min-h-[320px] border-t border-borders-subtle bg-background-base p-4">
                  <InvestigationChatPanel
                    threadId={threadId}
                    initialHypothesis={thread.initial_hypothesis}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    loading={loading}
                    readOnly={threadId === DEMO_THREAD_ID}
                  />
                </div>
              </div>
            </>
          )}
        </main>

        {/* Droite — Panel Intelligence */}
        <aside className="w-80 shrink-0 border-l border-borders-subtle bg-background-base flex flex-col min-h-[calc(100vh-64px)]">
          <div className="px-4 py-3 border-b border-borders-subtle flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Target className="w-4 h-4 text-[#E1463E]" />
              Intelligence
            </h2>
            {thread && (
              <button
                type="button"
                onClick={handleExportBrief}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-borders-subtle text-xs font-medium text-text-secondary hover:bg-borders-subtle hover:text-text-primary transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Brief
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!thread ? (
              <p className="text-text-secondary text-sm">Select an investigation to see the hypothesis state.</p>
            ) : detailsSelection && graph ? (
              <InvestigationDetailsPanel selection={detailsSelection} graph={graph} onClose={clearSelection} />
            ) : (
              <>
                <div>
                  <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Hypothèse</h3>
                  <p className="text-sm text-text-primary leading-relaxed">{thread.initial_hypothesis}</p>
                </div>
                {graph && graph.paths.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">Paths</h3>
                      <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showDeadPaths}
                          onChange={(e) => setShowDeadPaths(e.target.checked)}
                          className="rounded border-borders-subtle"
                        />
                        Show dead
                      </label>
                    </div>
                    <ul className="space-y-1.5">
                      {(showDeadPaths ? graph.paths : graph.paths.filter((p) => p.status !== 'dead')).map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => handlePathClick(p.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                              selectedPathId === p.id
                                ? 'border-[#E1463E] bg-[#E1463E]/10 text-text-primary'
                                : 'border-borders-subtle bg-background-base hover:border-[#E1463E]/40 text-text-primary'
                            } ${p.status === 'dead' ? 'opacity-75' : ''}`}
                          >
                            <span className="font-medium truncate block">{p.hypothesis_label || p.id}</span>
                            <span className="text-xs text-text-muted">{p.status} · {p.confidence} %</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {thread.investigative_axes && thread.investigative_axes.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Axes d'enquête</h3>
                    <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                      {thread.investigative_axes.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {thread.current_assessment && (
                  <div>
                    <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Évaluation</h3>
                    <p className="text-sm text-text-primary">
                      {ASSESSMENT_LABELS[thread.current_assessment] ?? thread.current_assessment}
                    </p>
                  </div>
                )}
                {thread.confidence_score != null && (
                  <div>
                    <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Confiance</h3>
                    <p className="text-sm text-text-primary">
                      {thread.confidence_score >= 0 && thread.confidence_score <= 100
                        ? `${thread.confidence_score} %`
                        : `${Math.round(Number(thread.confidence_score) * 100)} %`}
                    </p>
                  </div>
                )}
                {thread.blind_spots && thread.blind_spots.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Angles morts
                    </h3>
                    <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                      {thread.blind_spots.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(!thread.current_assessment && !thread.blind_spots?.length) && (
                  <p className="text-text-muted text-xs">
                    Envoyez des messages pour que le detective collecte des preuves et mette à jour la synthèse.
                  </p>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

export default function InvestigationWorkspacePage() {
  return (
    <ProtectedRoute>
      <InvestigationWorkspaceContent />
    </ProtectedRoute>
  );
}
