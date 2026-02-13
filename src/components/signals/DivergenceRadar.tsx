/**
 * DivergenceRadar — Top divergences between Nucigen model and Polymarket crowd
 *
 * Displayed at the top of the Pressure view when matches exist.
 */

import type { PressureSignal } from '../../types/intelligence';
import { BarChart3, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface DivergenceRadarProps {
  signals: PressureSignal[];
  onToggleFilter: () => void;
  filterActive: boolean;
}

function getDivColor(div: number): string {
  const abs = Math.abs(div);
  if (abs >= 0.25) return 'text-red-400';
  if (abs >= 0.10) return 'text-amber-400';
  return 'text-emerald-400';
}

function getDivBg(div: number): string {
  const abs = Math.abs(div);
  if (abs >= 0.25) return 'bg-red-500/10 border-red-500/20';
  if (abs >= 0.10) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-emerald-500/10 border-emerald-500/20';
}

export default function DivergenceRadar({ signals, onToggleFilter, filterActive }: DivergenceRadarProps) {
  const withPolymarket = signals.filter(s => s.polymarket);
  if (withPolymarket.length === 0) return null;

  // Sort by absolute divergence
  const sorted = [...withPolymarket].sort(
    (a, b) => (b.polymarket!.divergence_abs) - (a.polymarket!.divergence_abs)
  );

  const top3 = sorted.slice(0, 3);
  const strongDivergences = withPolymarket.filter(s => s.polymarket!.divergence_abs >= 0.25).length;
  const moderateDivergences = withPolymarket.filter(s => s.polymarket!.divergence_abs >= 0.10 && s.polymarket!.divergence_abs < 0.25).length;

  return (
    <div className="mb-6 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Divergence Radar</h3>
            <p className="text-[11px] text-slate-500">
              {withPolymarket.length} signal{withPolymarket.length > 1 ? 's' : ''} matched
              {strongDivergences > 0 && (
                <span className="text-red-400"> &middot; {strongDivergences} strong</span>
              )}
              {moderateDivergences > 0 && (
                <span className="text-amber-400"> &middot; {moderateDivergences} moderate</span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleFilter}
          className={`px-3 py-1.5 rounded-lg text-xs font-light transition-all border ${
            filterActive
              ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
              : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          {filterActive ? 'Show All' : 'Polymarket Only'}
        </button>
      </div>

      {/* Top divergences */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map(signal => {
          const pm = signal.polymarket!;
          const isPositive = pm.divergence > 0;

          return (
            <div
              key={signal.id}
              className={`rounded-lg border p-3 space-y-1.5 ${getDivBg(pm.divergence)}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-lg font-semibold ${getDivColor(pm.divergence)}`}>
                  {isPositive ? '+' : ''}{Math.round(pm.divergence * 100)}%
                </span>
                {isPositive ? (
                  <TrendingUp className={`w-4 h-4 ${getDivColor(pm.divergence)}`} />
                ) : (
                  <TrendingDown className={`w-4 h-4 ${getDivColor(pm.divergence)}`} />
                )}
              </div>
              <p className="text-xs text-white font-medium line-clamp-1">
                {signal.title}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>Crowd {Math.round(pm.crowd_probability * 100)}%</span>
                <span>&middot;</span>
                <span>Model {Math.round(pm.model_probability * 100)}%</span>
              </div>
              <p className="text-[10px] text-slate-600 line-clamp-1">
                {pm.question}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
