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
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-[#E1463E] animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading search session...</p>
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
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-md">
            <p className="text-text-primary mb-2">Failed to load search session</p>
            <p className="text-text-secondary text-sm mb-6">{error || 'Session not found'}</p>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-2 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg transition-colors"
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
      {/* Span full width of MainContent's 12-col grid so layout is visible (fixes black screen when single child) */}
      <div className="col-span-1 sm:col-span-12 flex flex-col min-w-0 w-full overflow-x-hidden min-h-[60vh] bg-background-base">
        {/* Content area: grid so col-span-* layout works (header, panels, results) - no min-h-0 to avoid collapse */}
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
      
      {/* Header: history menu (hamburger) + back button + query summary + Answer tab */}
      <div className="col-span-1 sm:col-span-12 mb-2 sm:mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start gap-2">
          <SearchHistoryMenu currentSessionId={sessionId ?? null} compact variant="inline" />
          <div className="min-w-0 flex-1">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-2 sm:mb-4 min-h-[44px] touch-manipulation"
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
        <Link
          to={`/search/session/${sessionId}/reponse`}
          className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-lg border border-borders-subtle bg-borders-subtle/50 text-text-secondary hover:text-text-primary hover:bg-[#E1463E]/10 hover:border-[#E1463E]/30 text-sm font-medium transition-colors shrink-0 touch-manipulation w-full sm:w-auto"
        >
          <span>Playground</span>
          <span className="text-xs opacity-80">→</span>
        </Link>
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
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background-glass-subtle border border-borders-subtle text-sm">
              <span className="text-text-secondary truncate">
                Sous-graphe autour de {session.graph.nodes.find((n) => n.id === subgraphFocusNodeId)?.label ?? subgraphFocusNodeId}
              </span>
              <button
                type="button"
                onClick={() => setSubgraphFocusNodeId(null)}
                className="shrink-0 px-3 py-1.5 rounded-md bg-borders-subtle hover:bg-borders-medium text-text-primary text-xs font-medium"
              >
                Revenir au graphe complet
              </button>
            </div>
          )}
          <div className="relative">
            {filtersOpen && (
              <div className="absolute top-0 left-0 right-0 z-20 p-3 rounded-lg bg-background-base border border-borders-subtle shadow-lg space-y-3 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">Filtres par type</span>
                  <button type="button" onClick={() => setFiltersOpen(false)} className="text-text-tertiary hover:text-text-primary text-xs">Fermer</button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-medium text-text-secondary mb-1">Nœuds</div>
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
                          <span className="text-text-primary capitalize">{t}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div>
                    <div className="font-medium text-text-secondary mb-1">Liens</div>
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
                          <span className="text-text-primary">{t.replace('_', ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded border border-borders-subtle"
              >
                {filtersOpen ? 'Masquer filtres' : 'Filtres'}
              </button>
            </div>
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

      {/* Results Section */}
      <div id="results-section" className="col-span-1 sm:col-span-12 mt-8">
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

      {/* Impact Brief Modal */}
      {impactBriefOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setImpactBriefOpen(false)} aria-hidden />
          <div className="relative bg-background-base border border-borders-subtle rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto shadow-xl">
            <h3 className="text-lg font-semibold text-text-primary mb-3">Impact Brief</h3>
            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">{impactBriefText}</pre>
            <button
              type="button"
              onClick={() => setImpactBriefOpen(false)}
              className="mt-4 min-h-[44px] px-4 py-3 bg-borders-subtle hover:bg-borders-medium rounded-lg text-sm text-text-primary touch-manipulation"
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
