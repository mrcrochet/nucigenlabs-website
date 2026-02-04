/**
 * Search Response Page — Playground Détective (Knowledge Graph)
 * UI inspired by Detective Playground: paths list left, Evidence Network right.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import { buildBriefingPayload } from '../lib/investigation/build-briefing';
import { getPlaygroundMockGraph } from '../lib/investigation/playground-mock-graph';
import InvestigationBriefingView from '../components/investigation/InvestigationBriefingView';
import InvestigationFlowView from '../components/investigation/InvestigationFlowView';
import InvestigationTimelineView from '../components/investigation/InvestigationTimelineView';
import InvestigationMapView from '../components/investigation/InvestigationMapView';
import InvestigationDetailsPanel, { type DetailsSelection } from '../components/investigation/InvestigationDetailsPanel';
import type { SearchResult, KnowledgeGraph as KnowledgeGraphType } from '../types/search';
import type { InvestigationGraph, InvestigationGraphPath, InvestigationGraphNode } from '../types/investigation-graph';

interface SearchSession {
  id: string;
  query: string;
  inputType: 'text' | 'url';
  results: SearchResult[];
  buckets: any;
  graph: KnowledgeGraphType;
  meta: any;
  createdAt: string;
  investigationThreadId?: string;
}

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

function PathCard({
  path,
  graph,
  isSelected,
  showDeadPaths,
  onSelect,
  onExplorePath,
}: {
  path: InvestigationGraphPath;
  graph: InvestigationGraph;
  isSelected: boolean;
  showDeadPaths: boolean;
  onSelect: () => void;
  onExplorePath: () => void;
}) {
  const isVisible = showDeadPaths || path.status !== 'dead';
  if (!isVisible) return null;

  const pathNodeSet = new Set(path.nodes);
  const edgeCount = graph.edges.filter((e) => pathNodeSet.has(e.from) && pathNodeSet.has(e.to)).length;
  const keyNodes = path.nodes
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter(Boolean) as InvestigationGraphNode[];
  const evidenceSources = keyNodes.flatMap((n) => n.sources || []).filter(Boolean);
  const uniqueSources = Array.from(new Set(evidenceSources));

  const statusLabel =
    path.status === 'active' ? 'Piste active' : path.status === 'weak' ? 'Piste faible' : 'Piste morte';

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
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
              Éléments clés ({keyNodes.length})
            </h4>
            <div className="space-y-1">
              {keyNodes.slice(0, 8).map((node) => (
                <div key={node.id} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-gray-600 capitalize shrink-0">{node.type}</span>
                  <span className="text-gray-400 truncate">{node.label}</span>
                </div>
              ))}
              {keyNodes.length > 8 && (
                <div className="text-xs text-gray-600">+{keyNodes.length - 8} autres</div>
              )}
            </div>
          </div>

          {uniqueSources.length > 0 && (
            <div>
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Sources ({uniqueSources.length})
              </h4>
              <div className="space-y-1">
                {uniqueSources.slice(0, 4).map((src, idx) => (
                  <div key={idx} className="text-xs text-gray-500 truncate" title={src}>
                    {src}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExplorePath();
            }}
            className="w-full px-3 py-2 border border-gray-700 text-gray-400 text-xs hover:bg-gray-800 transition-colors"
          >
            Explorer la piste →
          </button>
        </div>
      )}
    </div>
  );
}

/** Étape 1 : ?mock=1 affiche un graphe mock (pas d’API). Étape 2 : sans mock = backend. Étape 3 : temps réel plus tard. */
const PLAYGROUND_THREAD_ID = 'playground';

function SearchResponsePageContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  /** Pour l'instant : 1 seul Playground, 0 appel API, données mockées. */
  const [session, setSession] = useState<SearchSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [detectiveGraph, setDetectiveGraph] = useState<InvestigationGraph | null>(null);
  const [graphGenerating, setGraphGenerating] = useState(false);
  const [selectedView, setSelectedView] = useState<'graph' | 'timeline' | 'map' | 'sources' | 'briefing'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [showDeadPaths, setShowDeadPaths] = useState(false);

  const graph = detectiveGraph;

  const visiblePaths = useMemo(
    () => (graph?.paths ?? []).filter((p) => showDeadPaths || p.status !== 'dead'),
    [graph, showDeadPaths]
  );
  const deadPathsCount = useMemo(
    () => (graph?.paths ?? []).filter((p) => p.status === 'dead').length,
    [graph]
  );
  const activePathsCount = useMemo(
    () => (graph?.paths ?? []).filter((p) => p.status === 'active').length,
    [graph]
  );

  const briefingPayload = useMemo(() => {
    if (!graph || !session) return null;
    const minimalThread = {
      id: PLAYGROUND_THREAD_ID,
      user_id: '',
      title: session.query.length > 80 ? session.query.slice(0, 77) + '...' : session.query,
      initial_hypothesis: session.query,
      status: 'active' as const,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      investigative_axes: [],
      scope: 'geopolitics' as const,
      confidence_score: 0,
      blind_spots: [],
    };
    return buildBriefingPayload(minimalThread, graph);
  }, [graph, session]);

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

  /** Session : localStorage uniquement ; sinon session factice. Aucun appel API. */
  useEffect(() => {
    if (!sessionId) {
      navigate('/search');
      return;
    }
    let cancelled = false;
    setIsLoadingSession(true);
    setError(null);
    const storedSession = localStorage.getItem(`search-session-${sessionId}`);
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession) as SearchSession;
        if (!cancelled) setSession(parsed);
      } catch (err: any) {
        if (!cancelled) {
          setError('Invalid session data');
          toast.error('Failed to load session', { description: 'Session data is corrupted', duration: 5000 });
        }
      }
      if (!cancelled) setIsLoadingSession(false);
      return;
    }
    /** Mode démo : pas d’appel API — session factice pour afficher le graphe mock tout de suite. */
    const fakeSession: SearchSession = {
      id: sessionId,
      query: "Y a-t-il un lien entre la guerre au Soudan et l'or des pays arabes ?",
      inputType: 'text',
      results: [],
      buckets: {},
      graph: { entities: [], relations: [], events: [] },
      meta: {},
      createdAt: new Date().toISOString(),
    };
    if (!cancelled) {
      setSession(fakeSession);
      setIsLoadingSession(false);
    }
    return () => { cancelled = true; };
  }, [sessionId, navigate]);

  /** Étape 1 : mode mock — afficher un graphe fictif sans appeler l’API. */
  useEffect(() => {
    if (!session) return;
    const t = setTimeout(() => {
      setDetectiveGraph(getPlaygroundMockGraph(session.query));
      setThreadId(PLAYGROUND_THREAD_ID);
      setGraphGenerating(false);
    }, 80);
    return () => clearTimeout(t);
  }, [session]);

  if (isLoadingSession) {
    return (
      <AppShell>
        <SEO title="Playground Détective | Nucigen Labs" />
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Chargement…</span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !session) {
    return (
      <AppShell>
        <SEO title="Playground Détective | Nucigen Labs" />
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <p className="text-text-primary mb-2">Impossible de charger la session</p>
            <p className="text-text-secondary text-sm mb-6">{error || 'Session introuvable'}</p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la recherche
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const building = !graph && (graphGenerating || threadId);
  const hasGraph = !!graph;
  const totalSources = session.results?.length ?? 0;
  const startedAt = session.createdAt ? new Date(session.createdAt).toLocaleString('fr-FR') : '—';

  const showLoadingBlock = !!session && !hasGraph;
  const waitingForUser = false;

  useEffect(() => {
    if (!session || !sessionId) return;
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchResponsePage.tsx:render-state',message:'building/hasGraph state',data:{building,hasGraph,threadId:threadId||null,sessionId,showLoadingBlock},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
  }, [building, hasGraph, threadId, sessionId, session, showLoadingBlock]);

  return (
    <AppShell>
      <SEO
        title={`Playground Détective : ${session.query} | Nucigen Labs`}
        description="Exploration des pistes et du graphe de connaissance pour cette recherche"
      />

      <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
        {/* Header — reference style, responsive padding */}
        <div className="border-b border-gray-900 bg-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Link
                to={`/search/session/${sessionId}`}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 text-sm transition-colors min-h-[44px] items-center touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="truncate">Retour aux résultats</span>
              </Link>
            </div>

            {showLoadingBlock && (
              <div className="mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Enquête détective</div>
                <h1 className="text-xl font-semibold text-gray-200 truncate pr-4">{session.query}</h1>
              </div>
            )}

            {!showLoadingBlock && (
              <>
                <div className="mb-3 sm:mb-4">
                  <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">
                    Enquête détective
                  </div>
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-200 mb-2 break-words">{session.query}</h1>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
                    Plusieurs pistes sont explorées en parallèle. Chaque piste est une explication possible avec des
                    niveaux de preuve et de confiance variables. Les pistes restent visibles même lorsque les preuves
                    s&apos;affaiblissent ou contredisent l&apos;hypothèse.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      Début {startedAt}
                    </span>
                    <span>{totalSources} source(s) analysée(s)</span>
                    {hasGraph && <span>{activePathsCount} piste(s) active(s)</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeadPaths(!showDeadPaths)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] border text-xs transition-colors touch-manipulation w-full sm:w-auto ${
                      showDeadPaths
                        ? 'border-gray-600 bg-gray-900 text-gray-300'
                        : 'border-gray-800 text-gray-500 hover:border-gray-700'
                    }`}
                  >
                    {showDeadPaths ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {showDeadPaths ? 'Masquer' : 'Afficher'} les pistes mortes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Loading state — when waiting for user (Clerk) or when graph is building. Avoids empty black screen. */}
        {showLoadingBlock && (
          <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4 sm:px-6 py-8 sm:py-12">
            <div className="max-w-md w-full text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/80 border border-gray-700 mb-6">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-200 mb-2">
                {waitingForUser ? 'Chargement de votre session…' : 'Construction des pistes…'}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {waitingForUser
                  ? 'Vérification de la session en cours.'
                  : 'Tavily et les résultats de votre recherche alimentent le graphe. L’ingestion et l’extraction des preuves peuvent prendre une minute.'}
              </p>
              {!waitingForUser && (
                <p className="text-xs text-gray-600 mt-4">
                  La page se mettra à jour automatiquement dès que le graphe sera prêt.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main content — only when graph is ready */}
        {hasGraph && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              {/* Left panel — Paths list: full width on mobile, 4/12 on desktop */}
              <div className="col-span-1 lg:col-span-4 min-w-0 order-2 lg:order-1">
                <div className="lg:sticky lg:top-6">
                  <div className="mb-4">
                    <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-3">
                      Pistes d&apos;enquête ({visiblePaths.length})
                    </h2>
                  </div>
                  <div className="space-y-0">
                    {(graph?.paths ?? []).length === 0 ? (
                      <div className="p-4 border border-gray-800 text-sm text-gray-500">
                        Aucune piste pour l&apos;instant. Le graphe se remplit au fur et à mesure de l&apos;ingestion (Tavily + résultats de recherche).
                      </div>
                    ) : (
                      (graph?.paths ?? []).map((path) => (
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
                  {!showDeadPaths && deadPathsCount > 0 && (
                    <div className="mt-3 p-3 border border-gray-800 text-xs text-gray-600">
                      {deadPathsCount} piste(s) morte(s) masquée(s). Cliquez sur &quot;Afficher les pistes mortes&quot; pour les voir.
                    </div>
                  )}
                </div>
              </div>

              {/* Right panel — Evidence Network: full width on mobile first */}
              <div className="col-span-1 lg:col-span-8 min-w-0 order-1 lg:order-2">
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="text-sm text-gray-500 uppercase tracking-wider">Réseau de preuves</h2>
                    <div className="flex gap-2 flex-wrap">
                      {(['graph', 'timeline', 'map', 'sources', 'briefing'] as const).map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setSelectedView(view)}
                          className={`px-3 py-2 min-h-[40px] text-xs border transition-colors touch-manipulation ${
                            selectedView === view
                              ? 'border-gray-600 bg-gray-900 text-gray-300'
                              : 'border-gray-800 text-gray-500 hover:border-gray-700'
                          }`}
                        >
                          {view === 'graph' ? 'Graphe' : view === 'timeline' ? 'Chronologie' : view === 'map' ? 'Carte' : view === 'sources' ? 'Sources' : 'Briefing'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedView === 'graph' && (
                    <div className="border border-gray-900 bg-gray-950 p-3 sm:p-4 min-h-[300px] sm:min-h-[500px] overflow-x-auto">
                      <div className="text-xs text-gray-600 mb-4">
                        Vue graphe — Cliquez sur les nœuds pour explorer les liens
                      </div>
                      <div className="min-h-[280px] sm:min-h-[450px]">
                        {graph.nodes.length === 0 ? (
                          <div className="flex items-center justify-center min-h-[400px] text-gray-500 text-sm">
                            Aucun nœud dans le graphe pour l&apos;instant.
                          </div>
                        ) : (
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
                        )}
                      </div>
                    </div>
                  )}

                  {selectedView === 'timeline' && (
                    <div className="border border-gray-900 bg-gray-950 p-4 sm:p-6 min-h-[300px] sm:min-h-[500px] overflow-x-auto">
                      <div className="text-xs text-gray-600 mb-6">Chronologie des événements</div>
                      <div className="min-h-[400px]">
                        <InvestigationTimelineView
                          graph={graph}
                          selectedNodeId={selectedNodeId}
                          selectedPathId={selectedPathId}
                          showDeadPaths={showDeadPaths}
                          onNodeClick={handleNodeClick}
                          onPathClick={handlePathClick}
                        />
                      </div>
                    </div>
                  )}

                  {selectedView === 'map' && (
                    <div className="border border-gray-900 bg-gray-950 p-4 sm:p-6 min-h-[300px] sm:min-h-[500px] overflow-x-auto">
                      <div className="text-xs text-gray-600 mb-6">Vue carte des acteurs et événements</div>
                      <div className="min-h-[400px]">
                        <InvestigationMapView
                          graph={graph}
                          selectedNodeId={selectedNodeId}
                          selectedPathId={selectedPathId}
                          showDeadPaths={showDeadPaths}
                          onNodeClick={handleNodeClick}
                          onPathClick={handlePathClick}
                        />
                      </div>
                    </div>
                  )}

                  {selectedView === 'sources' && (
                    <div className="border border-gray-900 bg-gray-950 p-4 sm:p-6 min-h-[300px] sm:min-h-[500px]">
                      <div className="text-xs text-gray-600 mb-6">
                        Toutes les sources ({totalSources})
                      </div>
                      <div className="space-y-2">
                        {(session.results ?? []).map((r, idx) => (
                          <a
                            key={r.id ?? idx}
                            href={(r as { url?: string }).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-gray-800 p-3 flex items-center justify-between hover:border-gray-700 transition-colors group"
                          >
                            <span className="text-sm text-gray-400 truncate flex-1 min-w-0 mr-2">
                              {(r as { title?: string }).title || (r as { summary?: string }).summary?.slice(0, 60) || 'Source'}
                            </span>
                            <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-gray-500 shrink-0" />
                          </a>
                        ))}
                        {totalSources === 0 && (
                          <p className="text-sm text-gray-600">Aucune source enregistrée pour cette session.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedView === 'briefing' && (
                    <div className="border border-gray-900 bg-gray-950 p-4 sm:p-6 min-h-[300px] sm:min-h-[500px]">
                      <div className="text-xs text-gray-600 mb-6">Synthèse de l&apos;enquête</div>
                      {briefingPayload ? (
                        <InvestigationBriefingView payload={briefingPayload} onPathClick={handlePathClick} />
                      ) : (
                        <p className="text-sm text-gray-600">Briefing non disponible.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected node / edge / path detail — reference style */}
                {detailsSelection && (
                  <div className="mt-4 sm:mt-6 border border-gray-800 bg-gray-900/50 p-4 sm:p-5">
                    <InvestigationDetailsPanel
                      selection={detailsSelection}
                      graph={graph}
                      onClose={() => {
                        setSelectedNodeId(null);
                        setSelectedEdgeKey(null);
                        setSelectedPathId(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SearchResponsePage() {
  return (
    <ProtectedRoute>
      <SearchResponsePageContent />
    </ProtectedRoute>
  );
}
