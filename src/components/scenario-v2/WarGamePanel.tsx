import { useState } from 'react';
import type { ManipulationParameter, ScenarioBranch } from '../../types/scenario-v2';
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
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-5 h-full">
      <div className="text-[0.7rem] uppercase tracking-[2px] text-white font-light mb-1 pb-3 border-b border-white/[0.05] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
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
          className={`
            w-full mt-4 py-3 font-mono text-[0.7rem] uppercase tracking-[2px]
            bg-white/[0.02] border border-white/[0.12] rounded-lg
            text-white hover:bg-white/[0.06] hover:border-white/[0.2]
            transition-all duration-200 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isRecalculating ? 'RECALCULATING...' : 'RECALCULATE SCENARIO'}
        </button>
      </div>
    </div>
  );
}
