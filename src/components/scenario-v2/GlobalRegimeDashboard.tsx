import { useState } from 'react';
import type { GlobalRegimeData } from '../../types/scenario-v2';

interface GlobalRegimeDashboardProps {
  data: GlobalRegimeData;
}

const WEIGHT_STYLES: Record<string, string> = {
  high: 'border-[#ff0000] text-[#ff0000]',
  medium: 'border-[#ffaa00] text-[#ffaa00]',
  low: 'border-[#00ff00] text-[#00ff00]',
};

export default function GlobalRegimeDashboard({ data }: GlobalRegimeDashboardProps) {
  const [mode, setMode] = useState<'single' | 'regime'>('single');

  return (
    <div className="bg-black border border-[#1a1a1a] p-6">
      {/* Regime Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#1a1a1a]">
        <div>
          <div className="text-[0.65rem] font-mono text-[#666] tracking-[1px] mb-1">
            GLOBAL REGIME INDEX
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[3rem] font-mono font-normal text-[#ff0000]">
              {data.regimeIndex}
            </span>
            <span className="text-[1.5rem] font-mono text-[#666]">/ 100</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[0.65rem] font-mono text-[#666] tracking-[1px] mb-1">
            CURRENT REGIME
          </div>
          <div className="text-[1rem] font-mono text-[#ff0000] tracking-[1px] font-normal">
            {data.regimeName}
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('single')}
          className={`font-mono text-[0.65rem] tracking-[1px] px-4 py-2 border transition-all duration-200 cursor-pointer ${
            mode === 'single'
              ? 'bg-[#1a1a1a] text-white border-white'
              : 'bg-black text-[#666] border-[#2a2a2a] hover:bg-[#1a1a1a]'
          }`}
        >
          SINGLE EVENT
        </button>
        <button
          onClick={() => setMode('regime')}
          className={`font-mono text-[0.65rem] tracking-[1px] px-4 py-2 border transition-all duration-200 cursor-pointer ${
            mode === 'regime'
              ? 'bg-[#1a1a1a] text-white border-white'
              : 'bg-black text-[#666] border-[#2a2a2a] hover:bg-[#1a1a1a]'
          }`}
        >
          REGIME MODE
        </button>
      </div>

      {/* Regime View (expandable) */}
      {mode === 'regime' && (
        <div className="animate-[slideIn_0.3s_ease]">
          {/* Event Grid */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-px bg-[#1a1a1a]">
            {/* Headers */}
            <div className="bg-[#0a0a0a] p-3 text-[0.65rem] font-mono text-[#666] tracking-[1px] border border-[#1a1a1a]">EVENT</div>
            <div className="bg-[#0a0a0a] p-3 text-[0.65rem] font-mono text-[#666] tracking-[1px] border border-[#1a1a1a]">WEIGHT</div>
            <div className="bg-[#0a0a0a] p-3 text-[0.65rem] font-mono text-[#666] tracking-[1px] border border-[#1a1a1a]">ESCALATION</div>
            <div className="bg-[#0a0a0a] p-3 text-[0.65rem] font-mono text-[#666] tracking-[1px] border border-[#1a1a1a]">TRANSMISSION</div>

            {/* Rows */}
            {data.events.map((event, i) => (
              <>
                <div key={`name-${i}`} className="bg-black p-3 text-[0.75rem] font-mono text-white border border-[#1a1a1a] flex items-center">
                  {event.name}
                </div>
                <div key={`weight-${i}`} className="bg-black p-3 text-[0.75rem] font-mono border border-[#1a1a1a] flex items-center">
                  <span className={`inline-block px-2 py-0.5 border text-[0.65rem] tracking-[1px] font-mono ${WEIGHT_STYLES[event.weightLevel]}`}>
                    {event.weight.toFixed(2)}
                  </span>
                </div>
                <div key={`esc-${i}`} className="bg-black p-3 text-[0.75rem] font-mono text-[#b4b4b4] border border-[#1a1a1a] flex items-center">
                  {event.escalation}
                </div>
                <div key={`trans-${i}`} className="bg-black p-3 text-[0.75rem] font-mono text-[#b4b4b4] border border-[#1a1a1a] flex items-center">
                  {event.transmission}
                </div>
              </>
            ))}
          </div>

          {/* Composite Indices */}
          <div className="grid grid-cols-5 gap-px bg-[#1a1a1a] mt-4">
            {data.compositeIndices.map((index, i) => (
              <div key={i} className="bg-black border border-[#1a1a1a] p-4 text-left">
                <div className="text-[0.65rem] font-mono text-[#666] tracking-[1px] mb-2">
                  {index.label}
                </div>
                <div className="text-[1.5rem] font-mono font-normal" style={{ color: index.color }}>
                  {index.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
