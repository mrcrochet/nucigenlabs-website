/**
 * SectionHeader Component - Shared UI component for section titles
 */

import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({ title, subtitle, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-3 ${className}`}>
      <div>
        <h2 className="text-xl font-light text-white mb-0.5">{title}</h2>
        {subtitle && (
          <p className="text-sm text-slate-500 font-light">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

