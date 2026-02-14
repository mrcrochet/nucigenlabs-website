import type { DivergenceData } from '../../types/scenario-v2';

interface DivergenceMonitorProps {
  data: DivergenceData;
}

export default function DivergenceMonitor({ data }: DivergenceMonitorProps) {
  return (
    <div className="bg-black border border-[#1a1a1a] p-6 h-full">
      <div className="text-[0.7rem] font-mono font-normal text-white tracking-[2px] uppercase mb-4 pb-2 border-b border-[#1a1a1a]">
        MARKET DIVERGENCE MONITOR
      </div>

      <div className="bg-black border border-[#1a1a1a] p-6 mt-4">
        <div className="flex justify-between mb-4 pb-4 border-b border-[#1a1a1a]">
          <span className="text-[0.7rem] font-mono text-[#666] tracking-[1px]">MODEL PROBABILITY</span>
          <span className="text-[1.5rem] font-mono font-normal text-[#00aaff]">{data.modelProbability}%</span>
        </div>
        <div className="flex justify-between mb-4 pb-4 border-b border-[#1a1a1a]">
          <span className="text-[0.7rem] font-mono text-[#666] tracking-[1px]">CROWD PROBABILITY</span>
          <span className="text-[1.5rem] font-mono font-normal text-[#ffaa00]">{data.crowdProbability}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[0.7rem] font-mono text-[#666] tracking-[1px]">DELTA</span>
          <span className="text-[1.5rem] font-mono font-normal text-[#ff0000]">+{data.delta}%</span>
        </div>
      </div>

      {/* Sub-metrics */}
      <div className="mt-4 text-[0.7rem] font-mono text-[#666]">
        <div className="flex justify-between mb-2 pb-2 border-b border-[#1a1a1a]">
          <span>CONFIDENCE ADJUSTMENT</span>
          <span className="text-white">{data.confidenceAdjustment}</span>
        </div>
        <div className="flex justify-between mb-2 pb-2 border-b border-[#1a1a1a]">
          <span>VOLUME WEIGHTED</span>
          <span className="text-white">{data.volumeWeighted}</span>
        </div>
        <div className="flex justify-between">
          <span>CROWD VOLATILITY (7D)</span>
          <span className="text-[#ff0000]">{data.crowdVolatility7d}%</span>
        </div>
      </div>

      {/* Signal Interpretation */}
      <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#1a1a1a] text-[0.75rem] font-mono">
        <div className="text-[0.65rem] text-[#666] tracking-[1px] mb-2">SIGNAL INTERPRETATION</div>
        <div className="text-[#ff0000] font-normal">{data.signalInterpretation}</div>
      </div>

      {/* Key Signals */}
      <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#1a1a1a]">
        <div className="text-[0.65rem] font-mono text-[#666] tracking-[1px] mb-3">
          KEY SIGNALS DRIVING CURRENT REGIME
        </div>
        {data.keySignals.map((signal, i) => (
          <div key={i} className="text-[0.7rem] font-mono text-[#b4b4b4] mb-2 pl-4 relative">
            <span className="absolute left-0 text-white">→</span>
            {signal}
          </div>
        ))}
      </div>
    </div>
  );
}
