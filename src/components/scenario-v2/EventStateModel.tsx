import type { ScenarioEvent } from '../../types/scenario-v2';

interface EventStateModelProps {
  event: ScenarioEvent;
}

function MetricBox({ label, value, delta, period }: {
  label: string;
  value: number | string;
  delta: number;
  period: string;
}) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
      <div className="text-[0.65rem] uppercase tracking-[2px] text-zinc-500 mb-3">
        {label}
      </div>
      <div className="text-3xl font-mono font-light text-white mb-1">
        {value}
      </div>
      <div className={`text-xs font-mono ${isNegative ? 'text-red-400' : 'text-green-400'}`}>
        {isPositive ? '+' : ''}{delta} ({period})
      </div>
    </div>
  );
}

export default function EventStateModel({ event }: EventStateModelProps) {
  const { tensionIndex, escalationScore, diplomaticActivity, economicPressure } = event.metrics;

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-5">
      <div className="text-[0.7rem] uppercase tracking-[2px] text-white font-light mb-1 pb-3 border-b border-white/[0.05] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E1463E]" />
        EVENT STATE MODEL
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
        <MetricBox label="Tension Index" value={tensionIndex.value} delta={tensionIndex.delta} period={tensionIndex.period} />
        <MetricBox label="Escalation Score" value={escalationScore.value} delta={escalationScore.delta} period={escalationScore.period} />
        <MetricBox label="Diplomatic Activity" value={diplomaticActivity.value} delta={diplomaticActivity.delta} period={diplomaticActivity.period} />
        <MetricBox label="Economic Pressure" value={economicPressure.value} delta={economicPressure.delta} period={economicPressure.period} />
      </div>
    </div>
  );
}
