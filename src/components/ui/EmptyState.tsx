/**
 * EmptyState Component
 * 
 * Displays an elegant empty state when there's no data to show
 */

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="mb-4 p-4 bg-background-glass-subtle rounded-full">
          <Icon className="w-8 h-8 text-text-tertiary" />
        </div>
      )}
      
      <h3 className="text-lg font-medium text-text-primary mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-text-secondary max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary-red hover:bg-primary-red/90 text-white rounded-lg transition-colors text-sm font-light"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
