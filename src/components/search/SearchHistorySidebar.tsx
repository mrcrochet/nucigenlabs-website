/**
 * SearchHistorySidebar — ChatGPT-style list of recent searches per user
 * Fetches GET /api/search/history and navigates to /search/session/:id on click
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { History, Loader2, Search } from 'lucide-react';

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
}

export default function SearchHistorySidebar({
  currentSessionId = null,
  compact = false,
  className = '',
}: SearchHistorySidebarProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => navigate(`/search/session/${item.sessionId}`)}
                className={`w-full text-left rounded-lg px-3 py-2 flex items-start gap-2 transition-colors ${
                  isActive
                    ? 'bg-[#E1463E]/15 text-[#E1463E] border border-[#E1463E]/30'
                    : 'hover:bg-background-glass-subtle text-text-primary border border-transparent'
                } ${compact ? 'py-1.5' : ''}`}
              >
                <Search className="w-3.5 h-3.5 shrink-0 mt-0.5 text-text-tertiary" />
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm">{item.title || item.query}</span>
                  {!compact && (
                    <span className="text-xs text-text-tertiary">{formatDate(item.createdAt)}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
