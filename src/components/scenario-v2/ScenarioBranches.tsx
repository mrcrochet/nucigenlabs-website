import type { ScenarioBranch } from '../../types/scenario-v2';
import ScenarioBranchCard from './ScenarioBranchCard';

interface ScenarioBranchesProps {
  branches: ScenarioBranch[];
  selectedBranchId: string | null;
  onSelectBranch: (id: string) => void;
}

export default function ScenarioBranches({ branches, selectedBranchId, onSelectBranch }: ScenarioBranchesProps) {
  return (
    <div className="bg-black border border-[#1a1a1a] p-6 h-full">
      <div className="text-[0.7rem] font-mono font-normal text-white tracking-[2px] uppercase mb-4 pb-2 border-b border-[#1a1a1a]">
        PROBABILITY BRANCHES
      </div>
      <div className="flex flex-col gap-px mt-4 bg-[#1a1a1a]">
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
