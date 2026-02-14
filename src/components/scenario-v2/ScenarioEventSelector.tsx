interface ScenarioEventSelectorProps {
  events: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onCreateCustom?: () => void;
}

export default function ScenarioEventSelector({ events, selectedIndex, onSelect, onCreateCustom }: ScenarioEventSelectorProps) {
  return (
    <div className="flex items-center justify-between py-4 px-6 bg-[#0a0a0a] border-b border-[#1a1a1a]">
      <div className="flex items-center gap-6">
        <select
          value={selectedIndex}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="appearance-none bg-[#0a0a0a] border border-[#2a2a2a] text-[#b4b4b4] text-[0.75rem] font-mono px-3 py-2 min-w-[250px] focus:outline-none focus:border-[#3a3a3a] cursor-pointer rounded-none"
        >
          {events.map((event, i) => (
            <option key={i} value={i} className="bg-[#0a0a0a] text-[#b4b4b4]">
              {event}
            </option>
          ))}
        </select>

        {onCreateCustom && (
          <button
            onClick={onCreateCustom}
            className="bg-black border border-[#2a2a2a] text-[#666] py-2 px-4 font-mono text-[0.7rem] tracking-[1px] uppercase cursor-pointer transition-all duration-200 hover:border-white hover:text-white"
          >
            + CREATE CUSTOM SCENARIO
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-[#00ff00] animate-pulse" />
        <span className="text-[0.7rem] font-mono tracking-[1px] text-[#00ff00]">
          LIVE UPDATE
        </span>
      </div>
    </div>
  );
}
