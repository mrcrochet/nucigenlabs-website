/**
 * ErrorState Component
 * 
 * Displays error states with retry functionality
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { getUserFriendlyError } from '../../utils/error-handling-client';

interface ErrorStateProps {
  error: any;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export default function ErrorState({
  error,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}: ErrorStateProps) {
  const message = getUserFriendlyError(error);
  const isRetryable = error?.status >= 500 || error?.status === 429 || error?.status === 408;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 p-4 bg-red-500/10 rounded-full">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      
      <h3 className="text-lg font-medium text-red-400 mb-2">
        Something went wrong
      </h3>
      
      <p className="text-sm text-text-secondary max-w-md mb-6">
        {message}
      </p>
      
      {onRetry && isRetryable && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-primary-red hover:bg-primary-red/90 text-white rounded-lg transition-colors text-sm font-light"
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
