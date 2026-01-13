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
  // Consistent design tokens (using Tailwind values)
  const baseClasses = 'bg-white/[0.02] rounded-xl border border-white/[0.08] backdrop-blur-sm';
  const hoverClasses = hover ? 'hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-300 cursor-pointer' : '';
  const clickClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${clickClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}

