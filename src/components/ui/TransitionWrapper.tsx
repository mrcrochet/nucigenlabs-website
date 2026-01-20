/**
 * Transition Wrapper Component
 * 
 * Provides smooth transitions between loading, error, and content states
 */

import { ReactNode } from 'react';

interface TransitionWrapperProps {
  children: ReactNode;
  isLoading?: boolean;
  error?: any;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  isEmpty?: boolean;
  className?: string;
}

export default function TransitionWrapper({
  children,
  isLoading = false,
  error,
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty = false,
  className = '',
}: TransitionWrapperProps) {
  if (isLoading) {
    return (
      <div className={`transition-opacity duration-300 ${className}`}>
        {loadingComponent || <div className="text-center py-12">Loading...</div>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`transition-opacity duration-300 ${className}`}>
        {errorComponent || (
          <div className="text-center py-12 text-red-400">
            Error: {error.message || 'Something went wrong'}
          </div>
        )}
      </div>
    );
  }

  if (isEmpty && emptyComponent) {
    return (
      <div className={`transition-opacity duration-300 ${className}`}>
        {emptyComponent}
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-300 ${className}`}>
      {children}
    </div>
  );
}
