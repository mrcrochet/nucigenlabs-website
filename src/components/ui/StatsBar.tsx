/**
 * Stats bar — board-ready style (Corporate Impact).
 * Dark background, font-mono for numbers, orange (#E1463E) for risks, green for opportunities.
 */

import type { ReactNode } from 'react';

export interface StatsBarItem {
  label: string;
  value: string | number;
  /** 'default' | 'opportunity' (green) | 'risk' (orange) */
  variant?: 'default' | 'opportunity' | 'risk';
}

interface StatsBarProps {
  items: StatsBarItem[];
  className?: string;
}

export default function StatsBar({ items, className = '' }: StatsBarProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-gray-900/50 border border-gray-800 rounded-lg p-3 sm:p-4 ${className}`}
      role="region"
      aria-label="Statistics"
    >
      {items.map((item, i) => {
        const isOpportunity = item.variant === 'opportunity';
        const isRisk = item.variant === 'risk';
        const valueClass = isOpportunity
          ? 'text-green-400'
          : isRisk
            ? 'text-[#E1463E]'
            : 'text-gray-200';
        return (
          <div key={i}>
            <div className={`text-xl sm:text-2xl font-light font-mono ${valueClass}`}>
              {item.value}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-0.5">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
