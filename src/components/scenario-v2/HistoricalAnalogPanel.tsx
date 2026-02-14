import type { HistoricalAnalog } from '../../types/scenario-v2';
import HistoricalAnalogCard from './HistoricalAnalogCard';

interface HistoricalAnalogPanelProps {
  analogs: HistoricalAnalog[];
}

export default function HistoricalAnalogPanel({ analogs }: HistoricalAnalogPanelProps) {
  return (
    <div className="bg-black border border-[#1a1a1a] p-6 h-full">
      <div className="text-[0.7rem] font-mono font-normal text-white tracking-[2px] uppercase mb-4 pb-2 border-b border-[#1a1a1a]">
        HISTORICAL ANALOGS
      </div>
      <div className="flex flex-col gap-px mt-4 bg-[#1a1a1a]">
        {analogs.map((analog) => (
          <HistoricalAnalogCard key={analog.id} analog={analog} />
        ))}
      </div>
    </div>
  );
}
