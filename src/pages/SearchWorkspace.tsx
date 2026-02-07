/**
 * Search Workspace Page
 * 
 * Dynamic workspace generated after search action
 * Displays results, graph, and suggested questions
 * Each question = new search that enriches the workspace
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import KnowledgeGraph from '../components/search/KnowledgeGraph';
import ResultsPanel from '../components/search/ResultsPanel';
import InsightPanel from '../components/search/InsightPanel';
import SuggestedQuestions from '../components/search/SuggestedQuestions';
import SearchSessionHeader from '../components/search/SearchSessionHeader';
import ResultDetailsDrawer from '../components/search/ResultDetailsDrawer';
import EntityDetailsDrawer from '../components/search/EntityDetailsDrawer';
import SearchHistoryMenu from '../components/search/SearchHistoryMenu';
import type { SearchResult, KnowledgeGraph as KnowledgeGraphType, GraphNode, GraphLink } from '../types/search';

/** Build ego graph around a node (1 or 2 hops). */
function getEgoGraph(graph: KnowledgeGraphType, centerId: string, depth: number = 2): KnowledgeGraphType {
  const nodeIds = new Set<string>([centerId]);
  let frontier = new Set<string>([centerId]);
  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const link of graph.links) {
      const src = typeof link.source === 'object' ? (link.source as { id: string }).id : link.source;
      const tgt = typeof link.target === 'object' ? (link.target as { id: string }).id : link.target;
      if (frontier.has(src) || frontier.has(tgt)) {
        nodeIds.add(src);
        nodeIds.add(tgt);
        next.add(src);
        next.add(tgt);
      }
    }
    frontier = next;
  }
  const nodes = graph.nodes.filter((n) => nodeIds.has(n.id));
  const links = graph.links.filter((l) => {
    const src = typeof l.source === 'object' ? (l.source as { id: string }).id : l.source;
    const tgt = typeof l.target === 'object' ? (l.target as { id: string }).id : l.target;
    return nodeIds.has(src) && nodeIds.has(tgt);
  });
  return { nodes, links };
}

interface SearchSession {
  id: string;
  query: string;
  inputType: 'text' | 'url';
  results: SearchResult[];
  buckets: any;
  graph: KnowledgeGraphType;
  meta: any;
  createdAt: string;
  followups: Array<{
    id: string;
    query: string;
    results: SearchResult[];
    graph: KnowledgeGraphType;
    createdAt: string;
  }>;
}

function SearchWorkspaceContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const focusNodeId = searchParams.get('focus') || searchParams.get('highlight') || null;
  const { user } = useUser();
  const [session, setSession] = useState<SearchSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFollowup, setIsLoadingFollowup] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [selectedEntityNode, setSelectedEntityNode] = useState<GraphNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [impactBriefOpen, setImpactBriefOpen] = useState(false);
  const [impactBriefText, setImpactBriefText] = useState('');
  const [subgraphFocusNodeId, setSubgraphFocusNodeId] = useState<string | null>(null);
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<string[] | null>(null);
  const [visibleLinkTypes, setVisibleLinkTypes] = useState<string[] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load session from localStorage or from API (search history)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:effect',message:'Load session effect entry',data:{sessionId,hasUser:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H4'})}).catch(()=>{});
    // #endregion
    if (!sessionId) {
      navigate('/search');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const storedSession = localStorage.getItem(`search-session-${sessionId}`);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:storedSession',message:'Stored session check',data:{sessionId,hasStoredSession:!!storedSession,storedLen:storedSession?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H3'})}).catch(()=>{});
    // #endregion
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (!cancelled) setSession(parsed);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:parsed',message:'Session from localStorage',data:{hasResults:Array.isArray(parsed?.results),resultsLen:parsed?.results?.length,hasGraph:!!parsed?.graph},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
      } catch (err: any) {
        if (!cancelled) {
          setError('Invalid session data');
          toast.error('Failed to load session', { description: 'Session data is corrupted', duration: 5000 });
        }
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:parseError',message:'Parse error localStorage',data:{err:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
      }
      if (!cancelled) setIsLoading(false);
      return;
    }

    // Try loading from API (per-user search history)
    const loadFromApi = async () => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.id) headers['x-clerk-user-id'] = user.id;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:fetchStart',message:'Fetch session from API',data:{sessionId,hasClerkHeader:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2'})}).catch(()=>{});
      // #endregion
      const res = await fetch(`/api/search/session/${sessionId}`, { headers });
      if (cancelled) return;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:fetchDone',message:'API response',data:{ok:res.ok,status:res.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2'})}).catch(()=>{});
      // #endregion
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
          localStorage.setItem(`search-session-${sessionId}`, JSON.stringify(data.session));
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:setSessionApi',message:'Session set from API',data:{hasResults:Array.isArray(data.session?.results),resultsLen:data.session?.results?.length,hasGraph:!!data.session?.graph},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H5'})}).catch(()=>{});
          // #endregion
        } else {
          setError('Session not found');
          setTimeout(() => navigate('/search'), 2000);
        }
      } else {
        setError('Session not found');
        setTimeout(() => navigate('/search'), 2000);
      }
      setIsLoading(false);
    };
    loadFromApi();
    return () => { cancelled = true; };
  }, [sessionId, navigate, user?.id]);

  // Handle followup question
  const handleFollowup = useCallback(async (question: string) => {
    if (!sessionId || !session) return;

    setIsLoadingFollowup(true);

    try {
      const response = await fetch(`/api/search/session/${sessionId}/followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: question,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process followup');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update session with new followup
        setSession((prev) => {
          if (!prev) return null;
          
          const updated = {
            ...prev,
            results: [...prev.results, ...data.results],
            graph: {
              nodes: [...prev.graph.nodes, ...data.graph.nodes],
              links: [...prev.graph.links, ...data.graph.links],
            },
            followups: [
              ...prev.followups,
              {
                id: data.followupId,
                query: question,
                results: data.results,
                graph: data.graph,
                createdAt: new Date().toISOString(),
              },
            ],
          };
          
          // Update localStorage
          if (sessionId) {
            localStorage.setItem(`search-session-${sessionId}`, JSON.stringify(updated));
          }
          
          return updated;
        });

        toast.success('Followup search completed', {
          description: `Found ${data.results?.length || 0} additional results`,
          duration: 3000,
        });
      } else {
        throw new Error(data.error || 'Followup failed');
      }
    } catch (error: any) {
      console.error('[SearchWorkspace] Followup error:', error);
      toast.error('Followup search failed', {
        description: error.message,
        duration: 5000,
      });
    } finally {
      setIsLoadingFollowup(false);
    }
  }, [sessionId, session]);

  // Handle node explore (Ctrl/Cmd+click or double-click)
  const handleNodeExplore = useCallback((_nodeId: string, nodeLabel: string) => {
    if (!session) return;
    
    // Create contextual query
    const contextualQuery = `${session.query} ${nodeLabel}`;
    handleFollowup(contextualQuery);
  }, [session, handleFollowup]);

  const graphToShow = useMemo(() => {
    if (!session) return { nodes: [] as GraphNode[], links: [] as GraphLink[] };
    if (subgraphFocusNodeId) return getEgoGraph(session.graph, subgraphFocusNodeId, 2);
    return session.graph;
  }, [session, subgraphFocusNodeId]);

  const handleFocusSubgraph = useCallback((nodeId: string) => {
    setSubgraphFocusNodeId(nodeId);
    setSelectedEntityNode(null);
  }, []);

  // Handle node click: open ResultDetailsDrawer for event nodes that match a result, else EntityDetailsDrawer for entities
  const handleNodeClick = useCallback((nodeId: string) => {
    if (!session) return;
    const node = session.graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const matchingResult = session.results.find((r) => r.id === nodeId);
    if (node.type === 'event' && matchingResult) {
      setSelectedResultId(nodeId);
      setSelectedEntityNode(null);
    } else {
      setSelectedEntityNode(node);
      setSelectedResultId(null);
    }
  }, [session]);

  if (isLoading) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:render',message:'Render branch: loading',data:{isLoading,error:error||null,hasSession:!!session},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    return (
      <AppShell>
        <SEO title="Loading Search... | Nucigen Labs" />
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[600px] bg-black">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading search session...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !session) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:render',message:'Render branch: error',data:{isLoading,error:error||null,hasSession:!!session},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H4'})}).catch(()=>{});
    // #endregion
    return (
      <AppShell>
        <SEO title="Search Error | Nucigen Labs" />
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[600px] bg-black">
          <div className="text-center max-w-md text-white">
            <p className="text-gray-200 mb-2">Failed to load search session</p>
            <p className="text-gray-400 text-sm mb-6">{error || 'Session not found'}</p>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="px-6 py-2 bg-red-900/50 border border-red-900/50 hover:bg-red-900/70 text-red-400 transition-colors"
            >
              Back to Search
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const selectedResult = session.results.find(r => r.id === selectedResultId) || null;
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchWorkspace.tsx:render',message:'Render branch: success',data:{resultsLen:session?.results?.length,hasGraph:!!session?.graph},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H5'})}).catch(()=>{});
  // #endregion

  return (
    <AppShell>
      <SEO title={`${session.query} | Search | Nucigen Labs`} description="Search workspace with AI-powered intelligence" />
      <div className="col-span-1 sm:col-span-12 flex flex-col min-w-0 w-full overflow-x-hidden min-h-[60vh] bg-black text-white">
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-6">
      {/* Header – Detective style */}
      <div className="col-span-1 sm:col-span-12 border-b border-gray-900 pb-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start gap-2">
            <SearchHistoryMenu currentSessionId={sessionId ?? null} compact variant="inline" />
            <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-400 text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Search</span>
          </button>
          <SearchSessionHeader
            query={session.query}
            inputType={session.inputType}
            resultCount={session.results.length}
            createdAt={session.createdAt}
            sessionId={sessionId ?? undefined}
          />
          {/* Annonce pour lecteurs d'écran : nombre de résultats */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {session.results.length} résultat{session.results.length !== 1 ? 's' : ''}
          </div>
          </div>
        </div>
      </div>

      {/* Main Content: Insight Panel (Left) + Graph (Right) */}
      <div className="col-span-1 sm:col-span-5 min-w-0">
        <InsightPanel
          results={session.results}
          graph={session.graph}
          buckets={session.buckets}
          onViewResults={() => {
            // Scroll to results or show them
            document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onGenerateImpactBrief={() => {
            const results = session.results || [];
            const buckets = session.buckets || { events: [], actors: [], assets: [], sources: [] };
            const graph = session.graph || { nodes: [], links: [] };
            const lines: string[] = [];
            if (results.length > 0) {
              const top = results[0];
              lines.push('Summary: ' + (top.summary?.slice(0, 200) || top.title || '') + (top.summary && top.summary.length > 200 ? '...' : ''));
              lines.push('');
              lines.push('Key events:');
              results.slice(0, 5).forEach((r, i) => lines.push(`  ${i + 1}. ${r.title || r.summary?.slice(0, 80) || '—'}`));
            }
            const actors = buckets.actors?.length ? buckets.actors : graph.nodes?.filter((n: any) => ['person', 'company', 'organization', 'country'].includes(n.type))?.slice(0, 8).map((n: any) => n.label) || [];
            if (actors.length > 0) {
              lines.push('');
              lines.push('Actors: ' + actors.join(', '));
            }
            const events = buckets.events?.slice(0, 5).map((e: any) => e.title || e.name || e.id) || [];
            if (events.length > 0) {
              lines.push('');
              lines.push('Events: ' + events.join('; '));
            }
            setImpactBriefText(lines.length ? lines.join('\n') : 'No results to summarize.');
            setImpactBriefOpen(true);
          }}
        />
      </div>

      {/* Knowledge Graph - Central: full width on mobile, sticky only on sm+ */}
      <div className="col-span-1 sm:col-span-7 min-w-0 overflow-hidden">
        <div className="sm:sticky sm:top-24 w-full min-w-0 space-y-2">
          {subgraphFocusNodeId && (
            <div className="flex items-center justify-between gap-2 p-2 bg-gray-900/30 border border-gray-800 text-sm">
              <span className="text-gray-400 truncate">
                Sous-graphe autour de {session.graph.nodes.find((n) => n.id === subgraphFocusNodeId)?.label ?? subgraphFocusNodeId}
              </span>
              <button
                type="button"
                onClick={() => setSubgraphFocusNodeId(null)}
                className="shrink-0 px-3 py-1.5 border border-gray-800 hover:bg-gray-800 text-gray-300 text-xs"
              >
                Revenir au graphe complet
              </button>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="text-xs text-gray-500 hover:text-gray-400 px-2 py-1 border border-gray-800 hover:bg-gray-900"
              >
                {filtersOpen ? 'Masquer filtres' : 'Filtres'}
              </button>
            </div>
            {filtersOpen && (
              <div className="p-3 bg-gray-900/30 border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Filtres par type</span>
                  <button type="button" onClick={() => setFiltersOpen(false)} className="text-gray-500 hover:text-gray-400 text-xs">Fermer</button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-medium text-gray-500 mb-1">Nœuds</div>
                    {['event', 'country', 'company', 'commodity', 'organization', 'person'].map((t) => {
                      const selected = visibleNodeTypes === null || visibleNodeTypes.includes(t);
                      return (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              const all = ['event', 'country', 'company', 'commodity', 'organization', 'person'];
                              if (visibleNodeTypes === null) {
                                setVisibleNodeTypes(all.filter((x) => x !== t));
                              } else if (selected) {
                                const next = visibleNodeTypes.filter((x) => x !== t);
                                setVisibleNodeTypes(next.length ? next : null);
                              } else {
                                const next = [...visibleNodeTypes, t];
                                setVisibleNodeTypes(next.length === all.length ? null : next);
                              }
                            }}
                          />
                          <span className="text-gray-300 capitalize">{t}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div>
                    <div className="font-medium text-gray-500 mb-1">Liens</div>
                    {['causes', 'precedes', 'related_to', 'operates_in', 'exposes_to', 'impacts'].map((t) => {
                      const selected = visibleLinkTypes === null || visibleLinkTypes.includes(t);
                      return (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              const all = ['causes', 'precedes', 'related_to', 'operates_in', 'exposes_to', 'impacts'];
                              if (visibleLinkTypes === null) {
                                setVisibleLinkTypes(all.filter((x) => x !== t));
                              } else if (selected) {
                                const next = visibleLinkTypes.filter((x) => x !== t);
                                setVisibleLinkTypes(next.length ? next : null);
                              } else {
                                const next = [...visibleLinkTypes, t];
                                setVisibleLinkTypes(next.length === all.length ? null : next);
                              }
                            }}
                          />
                          <span className="text-gray-300">{t.replace('_', ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <KnowledgeGraph
              graph={graphToShow}
              query={session.query}
              onNodeClick={handleNodeClick}
              onNodeExplore={handleNodeExplore}
              height={600}
              focusNodeId={subgraphFocusNodeId ?? focusNodeId}
              visibleNodeTypes={visibleNodeTypes}
              visibleLinkTypes={visibleLinkTypes}
              filterControls={{
                visibleNodeTypes,
                visibleLinkTypes,
                setVisibleNodeTypes,
                setVisibleLinkTypes,
                filtersOpen,
                setFiltersOpen,
              }}
            />
          </div>
        </div>
      </div>
      </div>

      <div id="results-section" className="col-span-1 sm:col-span-12 mt-8 pt-6 border-t border-gray-900">
        <ResultsPanel
          results={session.results}
          buckets={session.buckets}
          isLoading={isLoadingFollowup}
          onResultClick={setSelectedResultId}
          onExploreDeeper={(resultId) => {
            const result = session.results.find(r => r.id === resultId);
            if (result) {
              handleFollowup(`Tell me more about: ${result.title}`);
            }
          }}
          graph={session.graph}
          query={session.query}
          sessionId={session.id}
        />
      </div>

      {/* Suggested Questions */}
      <div className="col-span-1 sm:col-span-12 mt-8">
        <SuggestedQuestions
          query={session.query}
          inputType={session.inputType}
          results={session.results}
          graph={session.graph}
          onQuestionClick={handleFollowup}
          isLoading={isLoadingFollowup}
        />
      </div>

      {/* Result Details Drawer */}
      {selectedResult && (
        <ResultDetailsDrawer
          result={selectedResult}
          isOpen={!!selectedResult}
          onClose={() => setSelectedResultId(null)}
          onExploreDeeper={() => {
            handleFollowup(`Tell me more about: ${selectedResult.title}`);
          }}
        />
      )}

      {/* Entity Details Drawer (graph entity nodes: company, person, country, etc.) */}
      {selectedEntityNode && (
        <EntityDetailsDrawer
          entityNode={selectedEntityNode}
          results={session.results}
          graph={session.graph}
          isOpen={!!selectedEntityNode}
          onClose={() => setSelectedEntityNode(null)}
          onFocusSubgraph={handleFocusSubgraph}
        />
      )}

      {impactBriefOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setImpactBriefOpen(false)} aria-hidden />
          <div className="relative bg-gray-900 border border-gray-800 p-6 w-full max-w-lg max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Impact Brief</h3>
            <pre className="text-sm text-gray-400 whitespace-pre-wrap font-sans">{impactBriefText}</pre>
            <button
              type="button"
              onClick={() => setImpactBriefOpen(false)}
              className="mt-4 min-h-[44px] px-4 py-3 border border-gray-800 hover:bg-gray-800 text-gray-300 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

        </div>
      </div>
    </AppShell>
  );
}

export default function SearchWorkspace() {
  return (
    <ProtectedRoute>
      <SearchWorkspaceContent />
    </ProtectedRoute>
  );
}
