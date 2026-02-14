import type { HistoricalAnalog } from '../../types/scenario-v2';

interface HistoricalAnalogCardProps {
  analog: HistoricalAnalog;
}

export default function HistoricalAnalogCard({ analog }: HistoricalAnalogCardProps) {
  return (
    <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[0.8rem] font-mono tracking-[1px] text-white">
          {analog.name}
        </span>
      </div>
      <div className="text-xs font-mono text-green-400 mb-2">
        SIMILARITY: {analog.similarityPercent}%
      </div>
      <p className="text-[0.7rem] text-zinc-500 leading-relaxed">
        {analog.description}
      </p>
    </div>
  );
}
