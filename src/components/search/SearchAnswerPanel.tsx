/**
 * Search Answer Panel – Chat avec les résultats web
 *
 * Chat Perplexity contextualisé par la recherche :
 * - Pas d’appel API au chargement (économie de jetons)
 * - L’utilisateur envoie un message ou clique « Expliquer » pour lancer la conversation
 * - Historique des messages (user / assistant) avec sources et questions liées sur la dernière réponse
 */

import { useState, useCallback } from 'react';
import { Send, Loader2, ExternalLink, Sparkles, MessageSquare, Settings, Globe, Image as ImageIcon, User } from 'lucide-react';
import { chatWithPerplexity, type PerplexityChatResponse } from '../../lib/api/perplexity-api';

type AnswerTab = 'answer' | 'links' | 'images';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  relatedQuestions?: string[];
  images?: string[];
}

export interface SearchAnswerPanelProps {
  /** Sujet de la recherche (session.query) */
  query: string;
  /** Contexte court des résultats pour enrichir les réponses */
  resultsSummary?: string;
  /** Si true, appelle l’API au montage (déconseillé pour économiser les jetons) */
  autoExplain?: boolean;
  className?: string;
}

export default function SearchAnswerPanel({
  query,
  resultsSummary,
  autoExplain = false,
  className = '',
}: SearchAnswerPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<AnswerTab>('answer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const parseResponse = (res: PerplexityChatResponse): Omit<ChatMessage, 'role'> => {
    const data = res.data;
    const content = data?.choices?.[0]?.message?.content ?? '';
    const citations = data?.citations ?? data?.choices?.[0]?.message?.citations ?? [];
    const relatedQuestions = data?.related_questions ?? [];
    const images = data?.images ?? data?.choices?.[0]?.message?.images ?? [];
    return {
      content,
      citations: Array.isArray(citations) ? citations : [],
      relatedQuestions: Array.isArray(relatedQuestions) ? relatedQuestions : [],
      images: Array.isArray(images) ? images : [],
    };
  };

  const requestAnswer = useCallback(
    async (apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<Omit<ChatMessage, 'role'> | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await chatWithPerplexity({
          messages: apiMessages,
          model: 'sonar-pro',
          options: {
            return_citations: true,
            return_related_questions: true,
            return_images: true,
          },
        });
        if (!res.success) {
          setError(res.error || 'Échec de la requête');
          return null;
        }
        return parseResponse(res);
      } catch (err: any) {
        setError(err?.message || 'Échec de la requête');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (userContent: string) => {
      const q = userContent.trim();
      if (!q) return;
      setInput('');

      const userMessage: ChatMessage = { role: 'user', content: q };
      setMessages((prev) => [...prev, userMessage]);

      const systemContent = resultsSummary
        ? `Sujet de la recherche et contexte (utilise pour enrichir ta réponse) :\n${resultsSummary.slice(0, 800)}`
        : undefined;
      const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        ...(systemContent ? [{ role: 'system' as const, content: systemContent }] : []),
        ...messages.flatMap((m) =>
          m.role === 'user' ? [{ role: 'user' as const, content: m.content }] : [{ role: 'assistant' as const, content: m.content }]
        ),
        { role: 'user', content: q },
      ];

      const reply = await requestAnswer(apiMessages);
      if (reply) {
        setMessages((prev) => [...prev, { role: 'assistant', ...reply }]);
      }
    },
    [messages, resultsSummary, requestAnswer]
  );

  const handleExplainClick = () => {
    sendMessage(query.trim());
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastIsAssistant = lastMessage?.role === 'assistant';
  const lastCitations = lastIsAssistant ? lastMessage.citations ?? [] : [];
  const lastRelated = lastIsAssistant ? lastMessage.relatedQuestions ?? [] : [];
  const lastImages = lastIsAssistant ? lastMessage.images ?? [] : [];

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 rounded-xl border border-borders-subtle bg-background-base overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-borders-subtle flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#E1463E]" />
          <span className="text-sm font-semibold text-text-primary">Chat avec les résultats web</span>
        </div>
        {messages.length === 0 && !loading && (
          <button
            type="button"
            onClick={handleExplainClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E1463E]/10 hover:bg-[#E1463E]/20 text-[#E1463E] text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Expliquer ce sujet
          </button>
        )}
      </div>

      {/* Sujet de la recherche */}
      <div className="px-4 py-2 border-b border-borders-subtle bg-borders-subtle/30 shrink-0">
        <p className="text-xs text-text-secondary">
          <span className="font-medium text-text-primary">Sujet :</span> {query}
        </p>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {error && (
          <div className="rounded-lg bg-[#E1463E]/10 border border-[#E1463E]/30 px-3 py-2 text-sm text-[#E1463E]">
            {error}
          </div>
        )}
        {loading && messages.length > 0 && (
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>Recherche en cours…</span>
          </div>
        )}
        {messages.length === 0 && !loading && (
          <div className="text-center py-8 text-text-secondary text-sm">
            <p className="mb-2">Posez une question sur votre recherche pour discuter avec les résultats du web.</p>
            <p className="text-xs">Aucun jeton API n’est utilisé tant que vous n’envoyez pas de message.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-[#E1463E]/20 text-[#E1463E]' : 'bg-borders-subtle text-text-secondary'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </div>
            <div
              className={`flex-1 min-w-0 max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#E1463E]/10 border border-[#E1463E]/20 text-text-primary'
                  : 'bg-borders-subtle/50 border border-borders-subtle text-text-primary'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && i === messages.length - 1 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Revue {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + contenu détaillé (dernière réponse uniquement) */}
      {lastIsAssistant && (lastCitations.length > 0 || lastRelated.length > 0 || lastImages.length > 0) && (
        <>
          <div className="border-t border-borders-subtle shrink-0">
            <nav className="flex gap-0 px-2" aria-label="Onglets réponse">
              {(
                [
                  { id: 'answer' as const, label: 'Answer', icon: Settings },
                  { id: 'links' as const, label: 'Links', icon: Globe },
                  { id: 'images' as const, label: 'Images', icon: ImageIcon },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === id ? 'border-[#E1463E] text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="overflow-y-auto p-4 border-t border-borders-subtle/50 max-h-52 shrink-0">
            {activeTab === 'answer' && (
              <div className="space-y-3">
                {lastRelated.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Questions liées</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {lastRelated.slice(0, 5).map((q, j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => sendMessage(q)}
                          className="px-3 py-2 rounded-lg bg-borders-subtle/50 border border-borders-subtle text-text-secondary text-xs hover:bg-[#E1463E]/10 hover:border-[#E1463E]/30 hover:text-text-primary transition-all text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'links' && (
              <div className="space-y-1.5">
                {lastCitations.length > 0 ? (
                  lastCitations.map((url, j) => (
                    <a
                      key={j}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-2 px-3 rounded-lg bg-borders-subtle/50 border border-borders-subtle hover:bg-borders-subtle text-text-secondary text-sm transition-colors group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-[#E1463E] flex-shrink-0" />
                      <span className="truncate">{url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-text-secondary">Aucune source pour cette réponse.</p>
                )}
              </div>
            )}
            {activeTab === 'images' && (
              <div className="space-y-2">
                {lastImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {lastImages.map((url, j) => (
                      <a
                        key={j}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-borders-subtle hover:border-borders-medium transition-colors"
                      >
                        <img src={url} alt="" className="w-full h-auto object-cover max-h-28" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">Aucune image.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Champ de saisie */}
      <div className="p-3 border-t border-borders-subtle shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question sur votre recherche…"
            className="flex-1 px-3 py-2.5 bg-background-elevated border border-borders-subtle rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3 py-2.5 bg-[#E1463E] hover:bg-[#E1463E]/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="sr-only">Envoyer</span>
          </button>
        </form>
      </div>
    </div>
  );
}
