/**
 * ErrorState - Reusable error display component
 * 
 * Displays errors with clear messaging and optional retry action
 */

import { AlertCircle, RefreshCw, Settings } from 'lucide-react';
import Button from './Button';

export interface ErrorStateProps {
  title: string;
  message: string;
  provider?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function ErrorState({
  title,
  message,
  provider,
  actionLabel,
  onAction,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`bg-red-500/10 border border-red-500/20 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-red-400 font-medium mb-1">{title}</h3>
          <p className="text-sm text-text-secondary mb-3">{message}</p>
          
          {provider && (
            <p className="text-xs text-text-secondary/60 mb-3">
              Provider: <span className="font-mono">{provider}</span>
            </p>
          )}
          
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              {actionLabel === 'Retry' || actionLabel === 'Retry Later' ? (
                <RefreshCw className="w-4 h-4 mr-2" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
