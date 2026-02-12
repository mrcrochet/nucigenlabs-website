/**
 * PressureClusterBar — Horizontal bar showing system pressure aggregates
 *
 * Each pill is clickable to filter by system.
 * Color intensity reflects average magnitude.
 */

import type { PressureCluster, PressureSystem } from '../../types/intelligence';

interface PressureClusterBarProps {
  clusters: PressureCluster[];
  activeSystem: PressureSystem | 'all';
  onSystemSelect: (system: PressureSystem | 'all') => void;
  loading?: boolean;
}

const SYSTEM_DOT_COLORS: Record<PressureSystem, string> = {
  Security: 'bg-red-500',
  Maritime: 'bg-blue-500',
  Energy: 'bg-amber-500',
  Industrial: 'bg-slate-400',
  Monetary: 'bg-purple-500',
};

function getMagnitudeIntensity(avg: number): string {
  if (avg >= 70) return 'border-white/20 bg-white/[0.08]';
  if (avg >= 50) return 'border-white/12 bg-white/[0.05]';
  return 'border-white/[0.06] bg-white/[0.03]';
}

export default function PressureClusterBar({
  clusters,
  activeSystem,
  onSystemSelect,
  loading,
}: PressureClusterBarProps) {
  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 h-9 w-32 rounded-lg bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (clusters.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-xs text-slate-500 font-light mb-2 uppercase tracking-wider">
        System Pressure
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          type="button"
          onClick={() => onSystemSelect('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-light transition-all border ${
            activeSystem === 'all'
              ? 'bg-[#E1463E] text-white border-[#E1463E]'
              : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          All
        </button>
        {clusters.map((cluster) => {
          const isActive = activeSystem === cluster.system;
          const dotColor = SYSTEM_DOT_COLORS[cluster.system as PressureSystem] || 'bg-slate-400';

          return (
            <button
              type="button"
              key={cluster.system}
              onClick={() =>
                onSystemSelect(isActive ? 'all' : (cluster.system as PressureSystem))
              }
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-light transition-all border ${
                isActive
                  ? 'bg-[#E1463E] text-white border-[#E1463E]'
                  : `${getMagnitudeIntensity(cluster.avg_magnitude)} text-slate-300 hover:text-white hover:bg-white/[0.08]`
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : dotColor}`} />
              <span>{cluster.system}</span>
              <span className={`text-xs ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                {cluster.avg_magnitude}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
