import type { DecisionLeverageItem } from '../../types/scenario-v2';

interface DecisionLeveragePanelProps {
  items: DecisionLeverageItem[];
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
  critical: 'text-red-500',
};

export default function DecisionLeveragePanel({ items }: DecisionLeveragePanelProps) {
  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-5 h-full">
      <div className="text-[0.7rem] uppercase tracking-[2px] text-white font-light mb-1 pb-3 border-b border-white/[0.05] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E1463E]" />
        DECISION LEVERAGE
      </div>
      <div className="flex flex-col gap-px mt-4 bg-white/[0.04] rounded-lg overflow-hidden">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-[#0a0a0a] p-3.5 border-b border-white/[0.04] last:border-b-0"
          >
            <span className="text-[0.7rem] uppercase tracking-[1px] text-zinc-500">
              {item.label}
            </span>
            <span className={`font-mono text-xs font-light ${SEVERITY_COLORS[item.severity] || 'text-white'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
