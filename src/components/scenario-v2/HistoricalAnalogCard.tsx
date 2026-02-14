import type { HistoricalAnalog } from '../../types/scenario-v2';

interface HistoricalAnalogCardProps {
  analog: HistoricalAnalog;
}

export default function HistoricalAnalogCard({ analog }: HistoricalAnalogCardProps) {
  return (
    <div className="bg-black border border-[#1a1a1a] p-4 cursor-pointer transition-all duration-200 hover:bg-[#0a0a0a]">
      <div className="text-[0.8rem] font-mono font-normal tracking-[1px] text-white mb-1">
        {analog.name}
      </div>
      <div className="text-[0.7rem] font-mono text-[#00ff00]">
        SIMILARITY: {analog.similarityPercent}%
      </div>
      <div className="mt-2 text-[0.7rem] font-mono text-[#666] leading-relaxed">
        {analog.description}
      </div>
    </div>
  );
}
