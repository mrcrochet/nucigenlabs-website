/**
 * SearchHistorySidebar — ChatGPT-style list of recent searches per user
 * Fetches GET /api/search/history and navigates to /search/session/:id on click
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { History, Loader2, Search, Trash2 } from 'lucide-react';

export interface SearchHistoryItem {
  id: string;
  sessionId: string;
  query: string;
  title: string;
  inputType: string;
  createdAt: string;
}

interface SearchHistorySidebarProps {
  currentSessionId?: string | null;
  compact?: boolean;
  className?: string;
  onDeleted?: (sessionId: string) => void;
}

export default function SearchHistorySidebar({
  currentSessionId = null,
  compact = false,
  className = '',
  onDeleted,
}: SearchHistorySidebarProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, sessionId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user?.id || deletingId) return;
      const previous = history;
      setDeletingId(sessionId);
      setHistory((prev) => prev.filter((h) => h.sessionId !== sessionId));
      try {
        const res = await fetch(`/api/search/history/${encodeURIComponent(sessionId)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'x-clerk-user-id': user.id },
        });
        const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
        if (res.ok && data.success) {
          try {
            localStorage.removeItem(`search-session-${sessionId}`);
          } catch {
            // ignore
          }
          onDeleted?.(sessionId);
        } else {
          setHistory(previous);
          toast.error('Impossible de supprimer la recherche', {
            description: data.error || (res.status === 401 ? 'Non autorisé' : 'Réessayez plus tard'),
            duration: 4000,
          });
        }
      } catch (err) {
        setHistory(previous);
        toast.error('Impossible de supprimer la recherche', {
          description: 'Erreur réseau ou serveur.',
          duration: 4000,
        });
      } finally {
        setDeletingId(null);
      }
    },
    [user?.id, onDeleted]
  );

  useEffect(() => {
    if (!user?.id) {
      setHistory([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch('/api/search/history?limit=30', {
      headers: { 'x-clerk-user-id': user.id },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && Array.isArray(data.history)) {
          setHistory(data.history);
        }
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return d.toLocaleDateString();
  };

  if (loading && history.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-text-tertiary ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Chargement…</span>
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-text-secondary mb-2">
        <History className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium">Recherches récentes</span>
      </div>
      <ul className="space-y-0.5 max-h-[min(50vh,400px)] overflow-y-auto">
        {history.map((item) => {
          const isActive = currentSessionId === item.sessionId;
          const isDeleting = deletingId === item.sessionId;
          return (
            <li key={item.id}>
              <div
                className={`rounded-lg px-3 py-2 flex items-start gap-2 border transition-colors ${
                  isActive
                    ? 'bg-[#E1463E]/15 border-[#E1463E]/30'
                    : 'border-transparent hover:bg-background-glass-subtle'
                } ${compact ? 'py-1.5' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/search/session/${item.sessionId}`)}
                  className={`flex-1 min-w-0 text-left flex items-start gap-2 ${
                    isActive ? 'text-[#E1463E]' : 'text-text-primary'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 shrink-0 mt-0.5 text-text-tertiary" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-sm">{item.title || item.query}</span>
                    {!compact && (
                      <span className="text-xs text-text-tertiary">{formatDate(item.createdAt)}</span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, item.sessionId)}
                  disabled={isDeleting}
                  aria-label={`Supprimer « ${(item.title || item.query).slice(0, 30)}…`}
                  className="shrink-0 p-1.5 rounded-md text-text-tertiary hover:text-[#E1463E] hover:bg-background-glass-medium transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
