/**
 * Card Component - Shared UI component for consistent card styling
 */

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className = '', onClick, hover = false }: CardProps) {
  const baseClasses = 'bg-white/[0.02] rounded-2xl border border-white/[0.02]';
  const hoverClasses = hover ? 'hover:bg-white/[0.03] hover:border-white/[0.05] transition-all cursor-pointer' : '';
  const clickClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${clickClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

