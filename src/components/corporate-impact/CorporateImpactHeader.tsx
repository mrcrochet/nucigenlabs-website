/**
 * Corporate Impact Header
 *
 * Investigation-report style: label, title, meta line, Export/Share, stats bar
 */

import { Clock, Download, Share2 } from 'lucide-react';
import type { MarketSignalStats } from '../../types/corporate-impact';

interface CorporateImpactHeaderProps {
  stats: MarketSignalStats;
}

export default function CorporateImpactHeader({ stats }: CorporateImpactHeaderProps) {
  const handleExport = () => {
    // Placeholder: trigger export (CSV/PDF)
  };
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Corporate Impact Report',
        url: window.location.href,
        text: 'Event-driven corporate exposure — Nucigen',
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  return (
    <div
      data-corporate-impact-header
      className="border-b border-gray-900 bg-black"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <div className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-2">
              Corporate Impact Report
            </div>
            <h1 className="text-xl font-semibold text-gray-200 mb-1">
              Event-driven corporate exposure
            </h1>
            <p className="text-xs text-gray-500 mt-1 italic">
              How real-world events are likely to affect companies. Not investment advice.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" aria-hidden />
                Last 30 days
              </span>
              <span>•</span>
              <span>{stats.total_signals} signals</span>
              <span>•</span>
              <span className="font-mono">{stats.avg_confidence} confidence</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 border border-gray-800 text-gray-400 text-xs hover:bg-gray-900 transition-colors flex items-center gap-2"
              aria-label="Export report"
            >
              <Download className="w-3 h-3" aria-hidden />
              Export
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 border border-gray-800 text-gray-400 text-xs hover:bg-gray-900 transition-colors flex items-center gap-2"
              aria-label="Share report"
            >
              <Share2 className="w-3 h-3" aria-hidden />
              Share
            </button>
          </div>
        </div>

        {/* Stats bar — mockup style, 2x2 on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-gray-900/50 border border-gray-800 rounded-lg p-3 sm:p-4">
          <div>
            <div className="text-2xl font-light text-gray-200 font-mono">{stats.total_signals}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-0.5">Total Signals</div>
          </div>
          <div>
            <div className="text-2xl font-light text-green-400 font-mono">{stats.opportunities}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-0.5">Opportunities</div>
          </div>
          <div>
            <div className="text-2xl font-light text-[#E1463E] font-mono">{stats.risks}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-0.5">Risks</div>
          </div>
          <div>
            <div className="text-2xl font-light text-gray-200 font-mono">{stats.avg_confidence}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-0.5">Avg Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}
