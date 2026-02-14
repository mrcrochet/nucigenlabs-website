import type { TransmissionNode } from '../../types/scenario-v2';

interface TransmissionNodeTooltipProps {
  node: TransmissionNode;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function TransmissionNodeTooltip({ node, position, onClose }: TransmissionNodeTooltipProps) {
  return (
    <div
      className="fixed z-50 bg-black border border-[#2a2a2a] p-4 min-w-[240px] shadow-2xl font-mono"
      style={{ left: position.x + 12, top: position.y - 10 }}
      onMouseLeave={onClose}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1a1a1a]">
        <span className="text-[0.8rem] text-white tracking-[1px]">{node.label}</span>
        <span className="text-[0.6rem] uppercase tracking-[1px] text-[#666]">{node.type}</span>
      </div>
      <div className="space-y-2 text-[0.7rem]">
        <div className="flex justify-between">
          <span className="text-[#666]">IMPACT SCORE</span>
          <span className="text-white">{node.impactScore}/10</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666]">SENSITIVITY</span>
          <span className={
            node.sensitivity === 'Critical' ? 'text-[#ff0000]' :
            node.sensitivity === 'High' ? 'text-[#ffaa00]' :
            'text-[#00ff00]'
          }>
            {node.sensitivity.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666]">LAG TIME</span>
          <span className="text-white">{node.lagTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666]">HISTORICAL CORRELATION</span>
          <span className="text-white">{node.historicalCorrelation.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
