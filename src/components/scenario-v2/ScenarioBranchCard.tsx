import type { ScenarioBranch } from '../../types/scenario-v2';

interface ScenarioBranchCardProps {
  branch: ScenarioBranch;
  isSelected: boolean;
  onSelect: () => void;
}

const TYPE_STYLES: Record<string, { border: string; probColor: string; impactClass: string }> = {
  best: { border: 'border-l-[#00ff00]', probColor: 'text-[#00ff00]', impactClass: 'border-[#00ff00] text-[#00ff00]' },
  base: { border: 'border-l-[#ffaa00]', probColor: 'text-[#ffaa00]', impactClass: 'border-[#ffaa00] text-[#ffaa00]' },
  worst: { border: 'border-l-[#ff0000]', probColor: 'text-[#ff0000]', impactClass: 'border-[#ff0000] text-[#ff0000]' },
};

export default function ScenarioBranchCard({ branch, isSelected, onSelect }: ScenarioBranchCardProps) {
  const styles = TYPE_STYLES[branch.type] || TYPE_STYLES.base;

  return (
    <div
      onClick={onSelect}
      className={`
        bg-black ${styles.border} border-l-2 p-4 cursor-pointer
        transition-all duration-200
        ${isSelected ? 'bg-[#0a0a0a] border-l-[5px]' : 'hover:bg-[#0a0a0a]'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.8rem] font-mono font-normal tracking-[1px] text-white">
          {branch.name}
        </span>
        <span className={`text-[1.5rem] font-mono font-normal ${styles.probColor}`}>
          {branch.probability}%
        </span>
      </div>

      {/* Description */}
      <p className="text-[0.75rem] font-mono text-[#666] leading-relaxed mb-3">
        {branch.description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-6 text-[0.7rem] font-mono text-[#666] tracking-[1px]">
        <span>HORIZON: {branch.horizon}</span>
        <span className={`inline-block px-2 py-0.5 border text-[0.65rem] tracking-[1px] ${styles.impactClass}`}>
          IMPACT {branch.impactPercent > 0 ? '+' : ''}{branch.impactPercent}%
        </span>
        <span>{branch.commodityImpact}</span>
      </div>

      {/* Conditional Probabilities (expanded when selected) */}
      {isSelected && branch.conditionalProbabilities && branch.conditionalProbabilities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1a1a1a] space-y-1.5">
          <div className="text-[0.6rem] font-mono uppercase tracking-[2px] text-[#666] mb-2">
            Conditional Probabilities
          </div>
          {branch.conditionalProbabilities.map((cp, i) => (
            <div key={i} className="flex items-center justify-between text-[0.7rem] font-mono">
              <span className="text-[#666]">{cp.label}</span>
              <span className={styles.probColor}>{(cp.probability * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
