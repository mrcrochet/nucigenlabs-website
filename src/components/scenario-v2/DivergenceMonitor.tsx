import type { DivergenceData } from '../../types/scenario-v2';

interface DivergenceMonitorProps {
  data: DivergenceData;
}

function DivergenceRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/[0.05] last:border-b-0">
      <span className="text-[0.7rem] uppercase tracking-[1px] text-zinc-500">{label}</span>
      <span className={`text-xl font-mono font-light ${color}`}>{value}</span>
    </div>
  );
}

function SubMetric({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-b-0">
      <span className="text-[0.65rem] uppercase tracking-[1px] text-zinc-600">{label}</span>
      <span className={`text-xs font-mono ${color}`}>{value}</span>
    </div>
  );
}

export default function DivergenceMonitor({ data }: DivergenceMonitorProps) {
  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-5 h-full">
      <div className="text-[0.7rem] uppercase tracking-[2px] text-white font-light mb-1 pb-3 border-b border-white/[0.05] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        MARKET DIVERGENCE MONITOR
      </div>

      <div className="mt-4 bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
        <DivergenceRow label="Model Probability" value={`${data.modelProbability}%`} color="text-blue-400" />
        <DivergenceRow label="Crowd Probability" value={`${data.crowdProbability}%`} color="text-amber-400" />
        <DivergenceRow label="Delta" value={`+${data.delta}%`} color="text-red-400" />
      </div>

      <div className="mt-4">
        <SubMetric label="Confidence Adjustment" value={String(data.confidenceAdjustment)} />
        <SubMetric label="Volume Weighted" value={data.volumeWeighted} />
        <SubMetric label="Crowd Volatility (7D)" value={`${data.crowdVolatility7d}%`} color="text-red-400" />
      </div>
    </div>
  );
}
