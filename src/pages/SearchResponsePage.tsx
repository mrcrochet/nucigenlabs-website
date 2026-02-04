/**
 * Search Response Page
 *
 * Dedicated page for the Perplexity-powered answer (Réponse).
 * Accessed via link from Search Workspace; no inline panel on results page.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import SearchAnswerPanel from '../components/search/SearchAnswerPanel';
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
}

function SearchResponsePageContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [session, setSession] = useState<SearchSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/search');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const storedSession = localStorage.getItem(`search-session-${sessionId}`);
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (!cancelled) setSession(parsed);
      } catch (err: any) {
        if (!cancelled) {
          setError('Invalid session data');
          toast.error('Failed to load session', { description: 'Session data is corrupted', duration: 5000 });
        }
      }
      if (!cancelled) setIsLoading(false);
      return;
    }

    const loadFromApi = async () => {
      const headers: Record<string, string> = {};
      if (user?.id) headers['x-clerk-user-id'] = user.id;
      const res = await fetch(`/api/search/session/${sessionId}`, { headers });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
          localStorage.setItem(`search-session-${sessionId}`, JSON.stringify(data.session));
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

  if (isLoading) {
    return (
      <AppShell>
        <SEO title="Réponse | Nucigen Labs" />
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
        <SEO title="Réponse | Nucigen Labs" />
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

  const resultsSummary = (() => {
    const results = session.results || [];
    const lines: string[] = [];
    if (results.length > 0) {
      results.slice(0, 5).forEach((r, i) => {
        lines.push(`${i + 1}. ${r.title || r.summary?.slice(0, 80) || '—'}`);
        if (r.summary) lines.push(r.summary.slice(0, 200) + (r.summary.length > 200 ? '...' : ''));
      });
    }
    return lines.join('\n').slice(0, 800);
  })();

  return (
    <AppShell>
      <SEO title={`Chat : ${session.query} | Nucigen Labs`} description="Chat avec les résultats web pour cette recherche" />

      <div className="col-span-1 sm:col-span-12 mb-6 min-w-0">
        <Link
          to={`/search/session/${sessionId}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Retour aux résultats</span>
        </Link>
        <h1 className="text-lg font-semibold text-text-primary truncate" title={session.query}>
          Chat avec les résultats web : {session.query}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Posez des questions sur votre recherche ; les réponses s’appuient sur le web. Aucun jeton API n’est utilisé tant que vous n’envoyez pas de message.
        </p>
      </div>

      <div className="col-span-1 sm:col-span-12 max-w-3xl min-h-[60vh] flex flex-col min-w-0 w-full">
        <SearchAnswerPanel
          query={session.query}
          resultsSummary={resultsSummary}
          autoExplain={false}
          className="min-h-[60vh] flex-1 min-w-0"
        />
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
