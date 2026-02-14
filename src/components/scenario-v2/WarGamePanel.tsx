import type { ManipulationParameter } from '../../types/scenario-v2';
import WarGameSlider from './WarGameSlider';

interface WarGamePanelProps {
  params: ManipulationParameter[];
  onParamsChange: (params: ManipulationParameter[]) => void;
  onRecalculate: () => void;
  isRecalculating: boolean;
}

export default function WarGamePanel({ params, onParamsChange, onRecalculate, isRecalculating }: WarGamePanelProps) {
  const handleSliderChange = (paramId: string, value: number) => {
    const updated = params.map(p =>
      p.id === paramId ? { ...p, value } : p
    );
    onParamsChange(updated);
  };

  return (
    <div className="bg-black border border-[#1a1a1a] p-6 h-full">
      <div className="text-[0.7rem] font-mono font-normal text-white tracking-[2px] uppercase mb-4 pb-2 border-b border-[#1a1a1a]">
        WAR-GAME MODE
      </div>
      <div className="mt-4">
        {params.map((param) => (
          <WarGameSlider
            key={param.id}
            param={param}
            onChange={(val) => handleSliderChange(param.id, val)}
          />
        ))}
        <button
          onClick={onRecalculate}
          disabled={isRecalculating}
          className="w-full mt-4 py-3 font-mono text-[0.7rem] uppercase tracking-[2px] bg-black border border-[#2a2a2a] text-white cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a] hover:border-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRecalculating ? 'RECALCULATING...' : 'RECALCULATE SCENARIO'}
        </button>
      </div>
    </div>
  );
}
