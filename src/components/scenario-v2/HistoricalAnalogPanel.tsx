import type { HistoricalAnalog } from '../../types/scenario-v2';
import HistoricalAnalogCard from './HistoricalAnalogCard';

interface HistoricalAnalogPanelProps {
  analogs: HistoricalAnalog[];
}

export default function HistoricalAnalogPanel({ analogs }: HistoricalAnalogPanelProps) {
  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-5 h-full">
      <div className="text-[0.7rem] uppercase tracking-[2px] text-white font-light mb-1 pb-3 border-b border-white/[0.05] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        HISTORICAL ANALOGS
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {analogs.map((analog) => (
          <HistoricalAnalogCard key={analog.id} analog={analog} />
        ))}
      </div>
    </div>
  );
}
