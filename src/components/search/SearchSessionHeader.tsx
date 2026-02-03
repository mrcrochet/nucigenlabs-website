/**
 * Search Session Header
 *
 * Displays query summary, metadata, and copy workspace link
 */

import { useState, useCallback } from 'react';
import { Link, Calendar, FileText, Globe, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SearchSessionHeaderProps {
  query: string;
  inputType: 'text' | 'url';
  resultCount: number;
  createdAt: string;
  /** Session id for building shareable workspace URL */
  sessionId?: string | null;
}

export default function SearchSessionHeader({
  query,
  inputType,
  resultCount,
  createdAt,
  sessionId,
}: SearchSessionHeaderProps) {
  const [copied, setCopied] = useState(false);
  const isUrl = inputType === 'url';
  const displayQuery = isUrl ? new URL(query).hostname : query;

  const handleCopyLink = useCallback(async () => {
    if (!sessionId) return;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/search/session/${sessionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier le lien');
    }
  }, [sessionId]);

  return (
    <div className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-4 sm:p-6 min-w-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            {isUrl ? (
              <Link className="w-5 h-5 text-[#E1463E] shrink-0" aria-hidden />
            ) : (
              <FileText className="w-5 h-5 text-[#E1463E] shrink-0" aria-hidden />
            )}
            <h2 className="text-xl font-semibold text-text-primary">
              {isUrl ? 'Analyzing Link' : 'Search Results'}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-sm text-text-secondary mb-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 shrink-0" aria-hidden />
              <span className="font-mono text-xs break-all">{displayQuery}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="w-4 h-4" aria-hidden />
              <span>{new Date(createdAt).toLocaleString()}</span>
            </div>
          </div>

          {isUrl && (
            <a
              href={query}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#E1463E] hover:underline inline-flex items-center gap-1"
            >
              <Link className="w-3 h-3" aria-hidden />
              Open original link
            </a>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {sessionId && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-borders-subtle text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle text-sm transition-colors whitespace-nowrap"
              title="Copier le lien du workspace"
              aria-label={copied ? 'Lien copié' : 'Copier le lien du workspace'}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500 shrink-0" aria-hidden />
              ) : (
                <Copy className="w-4 h-4 shrink-0" aria-hidden />
              )}
              <span>{copied ? 'Copié' : 'Copier le lien'}</span>
            </button>
          )}
          <div className="text-right shrink-0">
            <div className="text-2xl font-light text-text-primary" aria-hidden>{resultCount}</div>
            <div className="text-xs text-text-secondary">results</div>
          </div>
        </div>
      </div>
    </div>
  );
}
