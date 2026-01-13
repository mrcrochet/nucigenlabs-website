/**
 * Slider - Range slider component
 */

import { useState, useCallback } from 'react';

interface SliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1 }: SliderProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = useCallback((newValue: [number, number]) => {
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  return (
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue[0]}
        onChange={(e) => handleChange([Number(e.target.value), localValue[1]])}
        className="w-full h-2 bg-background-glass-medium rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #E1463E 0%, #E1463E ${((localValue[0] - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((localValue[0] - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((localValue[1] - min) / (max - min)) * 100}%, #E1463E ${((localValue[1] - min) / (max - min)) * 100}%, #E1463E 100%)`,
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue[1]}
        onChange={(e) => handleChange([localValue[0], Number(e.target.value)])}
        className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer"
      />
    </div>
  );
}
