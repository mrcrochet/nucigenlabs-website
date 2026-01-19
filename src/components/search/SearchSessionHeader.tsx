/**
 * Search Session Header
 * 
 * Displays query summary and metadata
 */

import { Link, Calendar, FileText, Globe } from 'lucide-react';

interface SearchSessionHeaderProps {
  query: string;
  inputType: 'text' | 'url';
  resultCount: number;
  createdAt: string;
}

export default function SearchSessionHeader({
  query,
  inputType,
  resultCount,
  createdAt,
}: SearchSessionHeaderProps) {
  const isUrl = inputType === 'url';
  const displayQuery = isUrl ? new URL(query).hostname : query;

  return (
    <div className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {isUrl ? (
              <Link className="w-5 h-5 text-[#E1463E]" />
            ) : (
              <FileText className="w-5 h-5 text-[#E1463E]" />
            )}
            <h2 className="text-xl font-semibold text-text-primary">
              {isUrl ? 'Analyzing Link' : 'Search Results'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="font-mono text-xs break-all">{displayQuery}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
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
              <Link className="w-3 h-3" />
              Open original link
            </a>
          )}
        </div>

        <div className="text-right">
          <div className="text-2xl font-light text-text-primary">{resultCount}</div>
          <div className="text-xs text-text-secondary">results</div>
        </div>
      </div>
    </div>
  );
}
