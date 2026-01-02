/**
 * Metric Component - Shared UI component for displaying metrics
 */

import { LucideIcon } from 'lucide-react';

interface MetricProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
  className?: string;
}

export default function Metric({ label, value, icon: Icon, change, className = '' }: MetricProps) {
  return (
    <div className={`bg-white/[0.02] rounded-xl p-4 border border-white/[0.02] ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <span className="text-xs text-slate-500 font-light uppercase tracking-wide">{label}</span>
        </div>
        {change && (
          <span className="text-xs text-slate-600 font-light">{change}</span>
        )}
      </div>
      <div className="text-2xl font-light text-white">{value}</div>
    </div>
  );
}

