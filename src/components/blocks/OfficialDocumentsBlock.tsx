/**
 * OfficialDocumentsBlock Component
 * 
 * Displays official documents from Firecrawl enrichment
 */

import { OfficialDocumentsBlock as OfficialDocumentsBlockType } from '../../types/blocks';
import SectionHeader from '../ui/SectionHeader';
import Card from '../ui/Card';
import { FileText, ExternalLink, Building2, Scale, Globe, Landmark, Users } from 'lucide-react';

interface OfficialDocumentsBlockProps {
  block: OfficialDocumentsBlockType;
  documents: Array<{
    id: string;
    url: string;
    title: string | null;
    content: string | null;
    domain: string;
    source_type: 'government' | 'regulator' | 'institution' | 'central_bank' | 'international_org';
    scraped_at: string;
  }> | null | undefined;
}

export default function OfficialDocumentsBlock({ block, documents }: OfficialDocumentsBlockProps) {
  if (!documents || documents.length === 0) {
    return null;
  }

  const maxDocuments = block.config?.maxDocuments || 10;
  const showSource = block.config?.showSource !== false;
  const displayDocuments = documents.slice(0, maxDocuments);

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'government':
        return Building2;
      case 'regulator':
        return Scale;
      case 'institution':
        return Building2;
      case 'central_bank':
        return Landmark;
      case 'international_org':
        return Globe;
      default:
        return FileText;
    }
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'government':
        return 'Government';
      case 'regulator':
        return 'Regulator';
      case 'institution':
        return 'Institution';
      case 'central_bank':
        return 'Central Bank';
      case 'international_org':
        return 'International Organization';
      default:
        return 'Official Source';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="mb-10 pb-10 border-b border-white/[0.02]">
      <SectionHeader title="Official Documents" />
      <div className="space-y-3">
        {displayDocuments.map((doc) => {
          const SourceIcon = getSourceIcon(doc.source_type);
          const sourceLabel = getSourceLabel(doc.source_type);

          return (
            <Card key={doc.id} className="p-4 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <FileText className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">
                        {doc.title || 'Untitled Document'}
                      </h4>
                      {showSource && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <SourceIcon className="w-3 h-3" />
                          <span>{sourceLabel}</span>
                          {doc.domain && (
                            <>
                              <span>•</span>
                              <span className="truncate">{doc.domain}</span>
                            </>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-slate-600 font-light">
                        Scraped {formatDate(doc.scraped_at)}
                      </p>
                      {doc.content && (
                        <p className="text-xs text-slate-400 font-light mt-2 line-clamp-2">
                          {doc.content.substring(0, 150)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
                  title="Open document"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </Card>
          );
        })}
      </div>
      {documents.length > maxDocuments && (
        <div className="mt-4 text-xs text-slate-500 text-center">
          Showing {maxDocuments} of {documents.length} documents
        </div>
      )}
    </div>
  );
}

