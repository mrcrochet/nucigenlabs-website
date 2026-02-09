/**
 * Search Session Header – analyst-grade, Detective-aligned
 * Query, timestamp, evidence count; compact, decision-maker tone.
 */

import { useState, useCallback } from 'react';
import { Link, Calendar, Globe, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SearchSessionHeaderProps {
  query: string;
  inputType: 'text' | 'url';
  resultCount: number;
  createdAt: string;
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
  let displayQuery = query;
  try {
    if (isUrl) displayQuery = new URL(query).hostname;
  } catch {
    displayQuery = query;
  }

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

  const formattedDate = new Date(createdAt).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-w-0 overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-200 mb-1">
        {isUrl ? 'Analyzing link' : 'Search Results'}
      </h2>
      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5 min-w-0">
          <Globe className="w-3 h-3 shrink-0" aria-hidden />
          <span className="truncate" title={query}>{displayQuery}</span>
        </span>
        <span>·</span>
        <span className="shrink-0">{formattedDate}</span>
        <span>·</span>
        <span className="font-mono shrink-0">{resultCount} results</span>
      </div>
      {isUrl && (
        <a
          href={query}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 mt-1"
        >
          <Link className="w-3 h-3" aria-hidden />
          Open original link
        </a>
      )}
      {sessionId && (
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-800 hover:bg-gray-900 text-xs text-gray-400 transition-colors whitespace-nowrap mt-3"
          title="Copier le lien du workspace"
          aria-label={copied ? 'Lien copié' : 'Copier le lien du workspace'}
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500 shrink-0" aria-hidden />
          ) : (
            <Copy className="w-3 h-3 shrink-0" aria-hidden />
          )}
          {copied ? 'Copied' : 'Share'}
        </button>
      )}
    </div>
  );
}
