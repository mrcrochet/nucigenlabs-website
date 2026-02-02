/**
 * Search Workspace Page
 * 
 * Dynamic workspace generated after search action
 * Displays results, graph, and suggested questions
 * Each question = new search that enriches the workspace
 */

import { useState, useEffect, useCallback } from 'react';
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
import type { SearchResult, KnowledgeGraph as KnowledgeGraphType } from '../types/search';

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
  const [error, setError] = useState<string | null>(null);
  const [impactBriefOpen, setImpactBriefOpen] = useState(false);
  const [impactBriefText, setImpactBriefText] = useState('');

  // Load session from localStorage (client-side for now)
  useEffect(() => {
    if (!sessionId) {
      navigate('/search');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Load from localStorage
    const storedSession = localStorage.getItem(`search-session-${sessionId}`);
    
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
      } catch (error: any) {
        console.error('[SearchWorkspace] Error parsing stored session:', error);
        setError('Invalid session data');
        toast.error('Failed to load session', {
          description: 'Session data is corrupted',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Session not found, redirect to search
      setError('Session not found');
      setIsLoading(false);
      setTimeout(() => {
        navigate('/search');
      }, 2000);
    }
  }, [sessionId, navigate]);

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

  // Handle node explore
  const handleNodeExplore = useCallback((_nodeId: string, nodeLabel: string) => {
    if (!session) return;
    
    // Create contextual query
    const contextualQuery = `${session.query} ${nodeLabel}`;
    handleFollowup(contextualQuery);
  }, [session, handleFollowup]);

  if (isLoading) {
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

  return (
    <AppShell>
      <SEO title={`${session.query} | Search | Nucigen Labs`} description="Search workspace with AI-powered intelligence" />
      
      {/* Header with back button, query summary, and Answer tab */}
      <div className="col-span-1 sm:col-span-12 mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </button>
          <SearchSessionHeader
            query={session.query}
            inputType={session.inputType}
            resultCount={session.results.length}
            createdAt={session.createdAt}
          />
        </div>
        <Link
          to={`/search/session/${sessionId}/reponse`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-borders-subtle bg-borders-subtle/50 text-text-secondary hover:text-text-primary hover:bg-[#E1463E]/10 hover:border-[#E1463E]/30 text-sm font-medium transition-colors shrink-0"
        >
          <span>Réponse</span>
          <span className="text-xs opacity-80">→</span>
        </Link>
      </div>

      {/* Main Content: Insight Panel (Left) + Graph (Right) */}
      <div className="col-span-1 sm:col-span-5">
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

      {/* Knowledge Graph - Central */}
      <div className="col-span-1 sm:col-span-7">
        <div className="sticky top-24">
          <KnowledgeGraph
            graph={session.graph}
            query={session.query}
            onNodeClick={setSelectedResultId}
            onNodeExplore={handleNodeExplore}
            height={600}
            focusNodeId={focusNodeId}
          />
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
              className="mt-4 px-4 py-2 bg-borders-subtle hover:bg-borders-medium rounded-lg text-sm text-text-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
