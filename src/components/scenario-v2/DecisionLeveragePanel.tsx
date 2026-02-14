import type { DecisionLeverageData } from '../../types/scenario-v2';

interface DecisionLeveragePanelProps {
  data: DecisionLeverageData;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-[#00ff00]',
  medium: 'text-white',
  high: 'text-[#ff0000]',
  critical: 'text-[#ff0000]',
};

export default function DecisionLeveragePanel({ data }: DecisionLeveragePanelProps) {
  return (
    <div className="bg-black border border-[#1a1a1a] p-6 h-full">
      <div className="text-[0.7rem] font-mono font-normal text-white tracking-[2px] uppercase mb-4 pb-2 border-b border-[#1a1a1a]">
        DECISION LEVERAGE
      </div>

      {/* Strategic Posture Score */}
      <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#1a1a1a] mb-4">
        <span className="text-[0.7rem] font-mono text-[#666] tracking-[1px]">STRATEGIC POSTURE</span>
        <span className="text-[1.5rem] font-mono font-normal text-[#ff0000]">
          {data.strategicPosture} {data.postureScore}/100
        </span>
      </div>

      {/* Decision Items */}
      <div className="flex flex-col gap-px bg-[#1a1a1a]">
        {data.items.map((item, i) => (
          <div
            key={i}
            className="bg-black border border-[#1a1a1a] p-4 flex items-center justify-between"
          >
            <span className="text-[0.7rem] font-mono text-[#666] tracking-[1px]">
              {item.label}
            </span>
            <span className={`font-mono text-[0.75rem] font-normal ${SEVERITY_COLORS[item.severity] || 'text-white'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
