/**
 * Search Status Bar
 * 
 * Shows loading state, cache status, and metadata
 */

import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SearchStatusBarProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  meta?: {
    fromCache?: boolean;
    latencyMs?: number;
  };
  error?: string | null;
}

export default function SearchStatusBar({ status, meta, error }: SearchStatusBarProps) {
  if (status === 'idle' && !error) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background-overlay/95 backdrop-blur-sm border-t border-borders-subtle px-4 py-2 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'loading' && (
            <>
              <Loader2 className="w-4 h-4 text-[#E1463E] animate-spin" />
              <span className="text-sm text-text-secondary">Searching...</span>
            </>
          )}
          {status === 'success' && !error && (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-text-secondary">
                {meta?.fromCache ? 'Results from cache' : 'Search complete'}
              </span>
            </>
          )}
          {(status === 'error' || error) && (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-400">{error || 'Search failed'}</span>
            </>
          )}
        </div>
        {meta?.latencyMs && status !== 'error' && !error && (
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <Clock className="w-3 h-3" />
            <span>{meta.latencyMs}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}
