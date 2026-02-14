import type { ScenarioBranch } from '../../types/scenario-v2';
import ScenarioBranchCard from './ScenarioBranchCard';

interface ScenarioBranchesProps {
  branches: ScenarioBranch[];
  selectedBranchId: string | null;
  onSelectBranch: (id: string) => void;
}

export default function ScenarioBranches({ branches, selectedBranchId, onSelectBranch }: ScenarioBranchesProps) {
  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-5 h-full">
      <div className="text-[0.7rem] uppercase tracking-[2px] text-white font-light mb-1 pb-3 border-b border-white/[0.05] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        PROBABILITY BRANCHES
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {branches.map((branch) => (
          <ScenarioBranchCard
            key={branch.id}
            branch={branch}
            isSelected={selectedBranchId === branch.id}
            onSelect={() => onSelectBranch(branch.id)}
          />
        ))}
      </div>
    </div>
  );
}
