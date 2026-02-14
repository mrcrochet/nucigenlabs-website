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
  const isNegative = delta < 0;

  return (
    <div className="bg-black border border-[#1a1a1a] p-4 text-left">
      <div className="text-[0.65rem] text-[#666] uppercase tracking-[1px] mb-3">
        {label}
      </div>
      <div className="text-[2rem] font-mono font-normal text-white">
        {value}
      </div>
      <div className={`text-[0.75rem] font-mono mt-1 ${isNegative ? 'text-[#ff0000]' : 'text-[#00ff00]'}`}>
        {delta > 0 ? '+' : ''}{delta} ({period})
      </div>
    </div>
  );
}

export default function EventStateModel({ event }: EventStateModelProps) {
  const { tensionIndex, escalationScore, diplomaticActivity, economicPressure } = event.metrics;

  return (
    <div className="bg-black border border-[#1a1a1a] p-6">
      <div className="text-[0.7rem] font-mono font-normal text-white tracking-[2px] uppercase mb-4 pb-2 border-b border-[#1a1a1a] flex items-center gap-2">
        EVENT STATE MODEL
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-4 bg-[#1a1a1a]">
        <MetricBox label="TENSION INDEX" value={tensionIndex.value} delta={tensionIndex.delta} period={tensionIndex.period} />
        <MetricBox label="ESCALATION SCORE" value={escalationScore.value} delta={escalationScore.delta} period={escalationScore.period} />
        <MetricBox label="DIPLOMATIC ACTIVITY" value={diplomaticActivity.value} delta={diplomaticActivity.delta} period={diplomaticActivity.period} />
        <MetricBox label="ECONOMIC PRESSURE" value={economicPressure.value} delta={economicPressure.delta} period={economicPressure.period} />
      </div>
    </div>
  );
}
