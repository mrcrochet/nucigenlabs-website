/**
 * Investigation Workspace Page — Intelligence Detective
 * 3 colonnes : liste des pistes (gauche), feed des signaux + chat (centre), panel intelligence (droite).
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Loader2, FileSearch, ExternalLink, ArrowLeft, Target, AlertTriangle } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import { getThreads, getThread, sendMessage } from '../lib/api/investigation-api';
import InvestigationChatPanel from '../components/investigation/InvestigationChatPanel';
import type {
  InvestigationThread,
  InvestigationSignal,
  InvestigationMessage,
} from '../types/investigation';

const ASSESSMENT_LABELS: Record<string, string> = {
  supported: 'Confirmée',
  partially_supported: 'Partiellement confirmée',
  unclear: 'Incertaine',
  contradicted: 'Contredite',
};

function InvestigationWorkspaceContent() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [threads, setThreads] = useState<InvestigationThread[]>([]);
  const [thread, setThread] = useState<InvestigationThread | null>(null);
  const [messages, setMessages] = useState<InvestigationMessage[]>([]);
  const [signals, setSignals] = useState<InvestigationSignal[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingThread, setLoadingThread] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } else {
      setError(res.error || 'Piste introuvable');
      setThread(null);
      setMessages([]);
      setSignals([]);
    }
    setLoadingThread(false);
  }, [user?.id]);

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
    },
    [threadId, user?.id]
  );

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
                      className={`block px-3 py-2.5 rounded-lg text-sm truncate transition-colors ${
                        t.id === threadId
                          ? 'bg-[#E1463E]/10 text-[#E1463E] font-medium'
                          : 'text-text-secondary hover:bg-borders-subtle hover:text-text-primary'
                      }`}
                    >
                      {t.title}
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
              {/* Feed des signaux */}
              <div className="shrink-0 border-b border-borders-subtle bg-background-elevated px-4 py-3">
                <h2 className="text-sm font-semibold text-text-primary">Feed des signaux</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Preuves et éléments collectés pour cette piste
                </p>
              </div>
              <div className="flex flex-col bg-background-base">
                <div className="p-4 space-y-3">
                  {signals.length === 0 && (
                    <p className="text-text-secondary text-sm py-4">Aucun signal pour l’instant. Envoyez un message dans le chat pour lancer la collecte.</p>
                  )}
                  {signals.map((sig) => (
                    <div
                      key={sig.id}
                      className="rounded-lg border border-borders-subtle bg-background-base p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-text-secondary uppercase">{sig.type}</span>
                        {sig.url && (
                          <a
                            href={sig.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#E1463E] hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Source
                          </a>
                        )}
                      </div>
                      <p className="text-sm font-medium text-text-primary">{sig.source}</p>
                      <p className="text-xs text-text-secondary line-clamp-2">{sig.summary}</p>
                      {sig.date && (
                        <p className="text-xs text-text-muted">{new Date(sig.date).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                  ))}
                </div>
                {/* Chat */}
                <div className="shrink-0 h-[320px] min-h-[320px] border-t border-borders-subtle bg-background-base p-4">
                  <InvestigationChatPanel
                    threadId={threadId}
                    initialHypothesis={thread.initial_hypothesis}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    loading={loading}
                  />
                </div>
              </div>
            </>
          )}
        </main>

        {/* Droite — Panel Intelligence */}
        <aside className="w-80 shrink-0 border-l border-borders-subtle bg-background-base flex flex-col min-h-[calc(100vh-64px)]">
          <div className="px-4 py-3 border-b border-borders-subtle">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Target className="w-4 h-4 text-[#E1463E]" />
              Intelligence
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!thread ? (
              <p className="text-text-secondary text-sm">Sélectionnez une enquête pour afficher l’état de l’hypothèse.</p>
            ) : (
              <>
                <div>
                  <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Hypothèse</h3>
                  <p className="text-sm text-text-primary leading-relaxed">{thread.initial_hypothesis}</p>
                </div>
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
                    <p className="text-sm text-text-primary">{Math.round(thread.confidence_score * 100)} %</p>
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
                {(!thread.current_assessment && thread.blind_spots?.length === 0) && (
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
