/**
 * Search Workspace Page
 * 
 * Dynamic workspace generated after search action
 * Displays results, graph, and suggested questions
 * Each question = new search that enriches the workspace
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import AnswerPanel from '../components/search/AnswerPanel';
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
  const navigate = useNavigate();
  const { user } = useUser();
  const [session, setSession] = useState<SearchSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFollowup, setIsLoadingFollowup] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load session from localStorage (client-side for now)
  useEffect(() => {
    if (!sessionId) {
      navigate('/search');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Load from localStorage
    const storageKey = `search-session-${sessionId}`;
    const storedSession = localStorage.getItem(storageKey);
    
    console.log('[SearchWorkspace] Loading session:', { sessionId, storageKey, hasStoredSession: !!storedSession });
    
    try {
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        console.log('[SearchWorkspace] Session parsed successfully:', { 
          hasResults: !!parsed.results, 
          resultsCount: parsed.results?.length || 0,
          hasGraph: !!parsed.graph,
          hasQuery: !!parsed.query
        });
        
        // Validate session structure
        if (!parsed.results || !Array.isArray(parsed.results)) {
          throw new Error('Invalid session structure: missing results array');
        }
        
        setSession(parsed);
        setIsLoading(false);
      } else {
        // Session not found, redirect to search
        console.warn('[SearchWorkspace] Session not found in localStorage:', storageKey);
        setError('Session not found');
        setIsLoading(false);
        toast.error('Session not found', {
          description: 'Redirecting to search...',
          duration: 2000,
        });
        setTimeout(() => {
          navigate('/search');
        }, 2000);
      }
    } catch (error: any) {
      console.error('[SearchWorkspace] Error loading session:', error);
      setError(error.message || 'Invalid session data');
      setIsLoading(false);
      toast.error('Failed to load session', {
        description: error.message || 'Session data is corrupted',
        duration: 5000,
      });
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
  const [activeTab, setActiveTab] = useState<'answer' | 'results'>('answer');

  return (
    <AppShell>
      <SEO title={`${session.query} | Search | Nucigen Labs`} description="Search workspace with AI-powered intelligence" />
      
      {/* Header with back button and query summary */}
      <div className="col-span-1 sm:col-span-12 mb-6">
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
            toast.info('Impact Brief generation coming soon');
          }}
        />
      </div>

      {/* Knowledge Graph - Central and Large */}
      <div className="col-span-1 sm:col-span-7">
        <div className="sticky top-24">
          <KnowledgeGraph
            graph={session.graph}
            onNodeClick={setSelectedResultId}
            onNodeExplore={handleNodeExplore}
            height={600}
          />
        </div>
      </div>

      {/* Answer / Links Tabs Section */}
      <div id="results-section" className="col-span-1 sm:col-span-12 mt-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-borders-subtle">
          <button
            onClick={() => setActiveTab('answer')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'answer'
                ? 'text-text-primary border-b-2 border-[#E1463E]'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Answer
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'results'
                ? 'text-text-primary border-b-2 border-[#E1463E]'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Results
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'answer' ? (
          <AnswerPanel
            query={session.query}
            results={session.results}
            onSourceClick={setSelectedResultId}
          />
        ) : activeTab === 'results' ? (
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
        ) : null}
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
