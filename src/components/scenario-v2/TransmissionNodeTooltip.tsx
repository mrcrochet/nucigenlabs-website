import type { TransmissionNode } from '../../types/scenario-v2';

interface TransmissionNodeTooltipProps {
  node: TransmissionNode;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function TransmissionNodeTooltip({ node, position, onClose }: TransmissionNodeTooltipProps) {
  return (
    <div
      className="fixed z-50 bg-[#0a0a0a] border border-white/[0.12] rounded-lg p-4 min-w-[220px] shadow-2xl"
      style={{ left: position.x + 12, top: position.y - 10 }}
      onMouseLeave={onClose}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-mono text-white tracking-[1px]">{node.label}</span>
        <span className="text-[0.6rem] uppercase tracking-[1px] text-zinc-600">{node.type}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">IMPACT SCORE</span>
          <span className="font-mono text-white">{node.impactScore}/10</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">SENSITIVITY</span>
          <span className={`font-mono ${node.sensitivity === 'Critical' ? 'text-red-400' : node.sensitivity === 'High' ? 'text-amber-400' : 'text-green-400'}`}>
            {node.sensitivity.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">LAG TIME</span>
          <span className="font-mono text-white">{node.lagTime}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">HIST. CORRELATION</span>
          <span className="font-mono text-white">{node.historicalCorrelation.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
