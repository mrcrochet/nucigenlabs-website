import type { ScenarioBranch } from '../../types/scenario-v2';
import Badge from '../ui/Badge';

interface ScenarioBranchCardProps {
  branch: ScenarioBranch;
  isSelected: boolean;
  onSelect: () => void;
}

const TYPE_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  best: { border: 'border-l-green-400', text: 'text-green-400', bg: 'bg-green-400' },
  base: { border: 'border-l-amber-400', text: 'text-amber-400', bg: 'bg-amber-400' },
  worst: { border: 'border-l-red-400', text: 'text-red-400', bg: 'bg-red-400' },
};

function ImpactBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  const severity = Math.abs(value);
  const variant = severity > 10 ? 'critical' : severity > 3 ? 'level' : 'neutral';
  return (
    <Badge variant={variant} className="text-[0.65rem] font-mono">
      IMPACT {isPositive ? '+' : ''}{value}%
    </Badge>
  );
}

export default function ScenarioBranchCard({ branch, isSelected, onSelect }: ScenarioBranchCardProps) {
  const colors = TYPE_COLORS[branch.type] || TYPE_COLORS.base;

  return (
    <div
      onClick={onSelect}
      className={`
        bg-white/[0.02] rounded-lg border border-white/[0.06]
        ${colors.border} border-l-[3px]
        p-4 cursor-pointer transition-all duration-200
        ${isSelected ? 'bg-white/[0.05] border-white/[0.12]' : 'hover:bg-white/[0.03]'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.8rem] font-mono tracking-[1px] text-white">
          {branch.name}
        </span>
        <span className={`text-2xl font-mono font-light ${colors.text}`}>
          {branch.probability}%
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 leading-relaxed mb-3">
        {branch.description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-[0.7rem] font-mono text-zinc-500 tracking-[1px]">
        <span>HORIZON: {branch.horizon}</span>
        <ImpactBadge value={branch.impactPercent} />
        <span>{branch.commodityImpact}</span>
      </div>

      {/* Conditional Probabilities (expanded when selected) */}
      {isSelected && branch.conditionalProbabilities && branch.conditionalProbabilities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-1.5">
          <div className="text-[0.6rem] uppercase tracking-[2px] text-zinc-600 mb-2">
            Conditional Probabilities
          </div>
          {branch.conditionalProbabilities.map((cp, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono">{cp.label}</span>
              <span className={`font-mono ${colors.text}`}>{(cp.probability * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
