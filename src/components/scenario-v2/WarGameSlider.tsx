import type { ManipulationParameter } from '../../types/scenario-v2';

interface WarGameSliderProps {
  param: ManipulationParameter;
  onChange: (value: number) => void;
}

export default function WarGameSlider({ param, onChange }: WarGameSliderProps) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between mb-2 text-[0.7rem] tracking-[1px]">
        <span className="text-zinc-500">{param.label}</span>
        <span className="font-mono text-white">{param.formatValue(param.value)}</span>
      </div>
      <input
        type="range"
        min={param.min}
        max={param.max}
        value={param.value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-[2px] bg-white/[0.08] appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:border
          [&::-webkit-slider-thumb]:border-black
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:bg-white
          [&::-moz-range-thumb]:border
          [&::-moz-range-thumb]:border-black
          [&::-moz-range-thumb]:cursor-pointer
        "
      />
    </div>
  );
}
