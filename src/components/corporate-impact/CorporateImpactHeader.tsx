/**
 * Corporate Impact Header
 * 
 * Displays stats and title for Corporate Impact page
 */

import type { MarketSignalStats } from '../../types/corporate-impact';

interface CorporateImpactHeaderProps {
  stats: MarketSignalStats;
}

export default function CorporateImpactHeader({ stats }: CorporateImpactHeaderProps) {
  return (
    <div 
      data-corporate-impact-header
      className="backdrop-blur-xl bg-gradient-to-br from-background-overlay to-background-glass-subtle border-b border-borders-subtle sticky top-16 z-30"
    >
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-light text-white mb-2">Corporate Impact</h1>
            <p className="text-slate-400 text-sm">How real-world events are likely to affect companies</p>
            <p className="text-slate-500 text-xs mt-1 italic">Event-driven corporate exposure. Not investment advice.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-light text-green-400">{stats.opportunities}</div>
            <div className="text-xs text-slate-400">Active Opportunities</div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-xl p-4">
          <div>
            <div className="text-2xl font-light text-white">{stats.total_signals}</div>
            <div className="text-xs text-slate-400">Total Signals</div>
          </div>
          <div>
            <div className="text-2xl font-light text-green-400">{stats.opportunities}</div>
            <div className="text-xs text-slate-400">Opportunities</div>
          </div>
          <div>
            <div className="text-2xl font-light text-[#E1463E]">{stats.risks}</div>
            <div className="text-xs text-slate-400">Risks</div>
          </div>
          <div>
            <div className="text-2xl font-light text-white">{stats.avg_confidence}</div>
            <div className="text-xs text-slate-400">Avg Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}
