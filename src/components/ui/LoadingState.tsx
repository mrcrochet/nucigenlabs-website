/**
 * LoadingState Component
 * 
 * Displays loading states with progress indicators
 */

interface LoadingStateProps {
  message?: string;
  progress?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingState({
  message = 'Loading...',
  progress,
  size = 'md',
  className = '',
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} border-2 border-primary-red/20 border-t-primary-red rounded-full animate-spin`} />
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-text-tertiary font-medium">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
      
      {message && (
        <p className="mt-4 text-sm text-text-secondary">
          {message}
        </p>
      )}
      
      {progress !== undefined && (
        <div className="mt-4 w-48 h-1 bg-background-glass-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-red transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
