import { ChevronDown } from 'lucide-react';

interface ScenarioEventSelectorProps {
  events: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function ScenarioEventSelector({ events, selectedIndex, onSelect }: ScenarioEventSelectorProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="relative">
        <select
          value={selectedIndex}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="appearance-none bg-white/[0.02] border border-white/[0.08] rounded-lg text-white/90 text-sm font-mono px-4 py-2.5 pr-10 min-w-[320px] focus:outline-none focus:border-white/[0.2] transition-colors cursor-pointer"
        >
          {events.map((event, i) => (
            <option key={i} value={i} className="bg-[#0a0a0a] text-white">
              {event}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
        <span className="text-[0.65rem] font-mono uppercase tracking-[2px] text-green-500">
          LIVE UPDATE
        </span>
      </div>
    </div>
  );
}
