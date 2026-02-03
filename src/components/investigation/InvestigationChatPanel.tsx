/**
 * Investigation Chat Panel — Chat pour une piste d'enquête
 * Affiche les messages du thread, envoie via sendMessage (backend appelle detective), preuves + Creuser.
 */

import { useState, useCallback } from 'react';
import { Send, Loader2, ExternalLink, MessageSquare, User, Search, X } from 'lucide-react';
import type { InvestigationMessage, EvidenceItem } from '../../types/investigation';

interface InvestigationChatPanelProps {
  threadId: string;
  initialHypothesis: string;
  messages: InvestigationMessage[];
  onSendMessage: (content: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export default function InvestigationChatPanel({
  threadId,
  initialHypothesis,
  messages,
  onSendMessage,
  loading = false,
  readOnly = false,
  className = '',
}: InvestigationChatPanelProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourceDrawer, setSourceDrawer] = useState<{
    url: string;
    title: string;
    loading: boolean;
    error: string | null;
    data: {
      title?: string;
      summary?: string;
      content?: string;
      entities?: Array<{ name: string; type?: string }>;
      keyFacts?: string[];
    } | null;
  } | null>(null);

  const openCreuserSource = useCallback((url: string, title: string) => {
    setSourceDrawer({ url, title, loading: true, error: null, data: null });
    fetch('/api/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) {
          setSourceDrawer((d) => (d ? { ...d, loading: false, error: json.error || 'Erreur' } : null));
          return;
        }
        setSourceDrawer((d) =>
          d
            ? {
                ...d,
                loading: false,
                data: {
                  title: json.enrichedData?.title,
                  summary: json.enrichedData?.summary,
                  content: json.enrichedData?.content,
                  entities: json.entities,
                  keyFacts: json.enrichedData?.keyFacts ?? json.keyFacts,
                },
              }
            : null
        );
      })
      .catch((err) => {
        setSourceDrawer((d) => (d ? { ...d, loading: false, error: err?.message || 'Erreur réseau' } : null));
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setInput('');
    setError(null);
    setSending(true);
    try {
      await onSendMessage(content);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const evidenceFromMessage = (msg: InvestigationMessage): EvidenceItem[] => {
    if (msg.role !== 'assistant') return [];
    const snap = msg.evidence_snapshot;
    if (Array.isArray(snap)) return snap as EvidenceItem[];
    return [];
  };

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 rounded-xl border border-borders-subtle bg-background-base overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-borders-subtle flex items-center gap-2 shrink-0">
        <MessageSquare className="w-4 h-4 text-[#E1463E]" />
        <span className="text-sm font-semibold text-text-primary">Chat — Affiner la piste</span>
      </div>
      <div className="px-4 py-2 border-b border-borders-subtle bg-borders-subtle/30 shrink-0">
        <p className="text-xs text-text-secondary">
          <span className="font-medium text-text-primary">Hypothèse :</span>{' '}
          <span className="line-clamp-2">{initialHypothesis}</span>
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {error && (
          <div className="rounded-lg bg-[#E1463E]/10 border border-[#E1463E]/30 px-3 py-2 text-sm text-[#E1463E]">
            {error}
          </div>
        )}
        {(loading || sending) && messages.length > 0 && (
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>Recherche en cours…</span>
          </div>
        )}
        {messages.length === 0 && !loading && !sending && (
          <div className="text-center py-8 text-text-secondary text-sm">
            <p className="mb-2">Posez une question pour affiner la piste ou explorer un angle.</p>
            <p className="text-xs">Ex. : « Quelles sociétés écrans ? », « Explorer les flux vers le Sénégal »</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-[#E1463E]/20 text-[#E1463E]' : 'bg-borders-subtle text-text-secondary'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0 max-w-[85%] space-y-3">
              <div
                className={`rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#E1463E]/10 border border-[#E1463E]/20 text-text-primary'
                    : 'bg-borders-subtle/50 border border-borders-subtle text-text-primary'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {msg.role === 'assistant' && evidenceFromMessage(msg).length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Preuves</span>
                  <div className="space-y-2">
                    {evidenceFromMessage(msg).map((ev, j) => (
                      <div
                        key={j}
                        className="rounded-lg border border-borders-subtle bg-borders-subtle/30 px-3 py-2.5 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-text-primary hover:text-[#E1463E] truncate flex-1 min-w-0"
                          >
                            {ev.title}
                          </a>
                          <button
                            type="button"
                            onClick={() => openCreuserSource(ev.url, ev.title)}
                            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs text-text-secondary hover:bg-[#E1463E]/10 hover:text-[#E1463E] transition-colors"
                          >
                            <Search className="w-3.5 h-3.5" />
                            Creuser
                          </button>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2">{ev.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {readOnly ? (
        <div className="p-4 border-t border-borders-subtle shrink-0 text-center text-xs text-text-muted">
          Démo : lecture seule. Explorez Flow, Timeline, Map et le Briefing.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 border-t border-borders-subtle shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Affiner la piste, explorer un angle…"
              className="flex-1 px-3 py-2.5 rounded-lg border border-borders-subtle bg-background-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex-shrink-0 p-2.5 rounded-lg bg-[#E1463E] hover:bg-[#E1463E]/90 text-white disabled:opacity-50 transition-colors"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      )}

      {/* Drawer Creuser cette source */}
      {sourceDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col sm:flex-row">
          <div className="absolute inset-0 bg-background-overlay" onClick={() => setSourceDrawer(null)} />
          <div className="relative w-full sm:max-w-lg sm:ml-auto h-full sm:h-auto sm:max-h-[90vh] bg-background-base border-l border-borders-subtle shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-borders-subtle shrink-0">
              <h3 className="text-sm font-semibold text-text-primary truncate pr-2">{sourceDrawer.title}</h3>
              <button
                type="button"
                onClick={() => setSourceDrawer(null)}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-borders-subtle hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sourceDrawer.loading && (
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement…
                </div>
              )}
              {sourceDrawer.error && (
                <p className="text-sm text-[#E1463E]">{sourceDrawer.error}</p>
              )}
              {!sourceDrawer.loading && sourceDrawer.data && (
                <>
                  {(sourceDrawer.data.summary || sourceDrawer.data.content) && (
                    <div>
                      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Résumé</h4>
                      <p className="text-sm text-text-primary whitespace-pre-wrap">
                        {sourceDrawer.data.summary || sourceDrawer.data.content}
                      </p>
                    </div>
                  )}
                  {sourceDrawer.data.entities && sourceDrawer.data.entities.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Entités</h4>
                      <div className="flex flex-wrap gap-2">
                        {sourceDrawer.data.entities.map((e, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-borders-subtle/50 text-xs text-text-primary">
                            {e.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {sourceDrawer.data.keyFacts && sourceDrawer.data.keyFacts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Faits clés</h4>
                      <ul className="list-disc list-inside text-sm text-text-primary space-y-1">
                        {sourceDrawer.data.keyFacts.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-4 py-3 border-t border-borders-subtle shrink-0">
              <a
                href={sourceDrawer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#E1463E] hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir la source
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
