/**
 * MetaRow Component - Shared UI component for displaying metadata
 * Used for time, confidence, impact, and other metadata
 */

import { LucideIcon } from 'lucide-react';

interface MetaRowProps {
  items: Array<{
    label: string;
    value: string | number;
    icon?: LucideIcon;
    variant?: 'default' | 'confidence' | 'impact';
  }>;
  className?: string;
}

export default function MetaRow({ items, className = '' }: MetaRowProps) {
  const getValueColor = (variant?: string, value?: number) => {
    if (variant === 'confidence') {
      if (typeof value === 'number') {
        if (value >= 0.8) return 'text-green-500/80';
        if (value >= 0.6) return 'text-yellow-500/80';
        return 'text-orange-500/80';
      }
    }
    if (variant === 'impact') {
      if (typeof value === 'number') {
        if (value >= 0.8) return 'text-red-500/80';
        if (value >= 0.6) return 'text-orange-500/80';
        return 'text-yellow-500/80';
      }
    }
    return 'text-slate-500';
  };

  return (
    <div className={`flex flex-wrap items-center gap-6 text-sm text-slate-500 font-light ${className}`}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const valueColor = getValueColor(item.variant, typeof item.value === 'number' ? item.value : undefined);
        const displayValue = typeof item.value === 'number' && item.value <= 1 
          ? `${(item.value * 100).toFixed(0)}%`
          : item.value;

        return (
          <div key={index} className="flex items-center gap-1.5">
            {Icon && <Icon className="w-4 h-4" />}
            <span className="text-slate-600">{item.label}:</span>
            <span className={valueColor}>{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
}

