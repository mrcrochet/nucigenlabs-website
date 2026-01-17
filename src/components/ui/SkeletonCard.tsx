/**
 * Skeleton Card Component
 * 
 * Loading placeholder for Discover cards with shimmer animation
 */

interface SkeletonCardProps {
  tier?: 'critical' | 'strategic' | 'background';
}

export default function SkeletonCard({ tier = 'strategic' }: SkeletonCardProps) {
  const tierClasses = {
    critical: 'border-[#E1463E]/30 bg-[#E1463E]/5 p-6',
    strategic: 'border-white/10 bg-white/5 p-6',
    background: 'border-white/5 bg-white/[0.02] p-4',
  };

  const tierPadding = {
    critical: 'p-6',
    strategic: 'p-6',
    background: 'p-4',
  };

  return (
    <div className={`${tierPadding[tier]} flex flex-col h-full border rounded-xl overflow-hidden ${tierClasses[tier]}`}>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      {/* Thumbnail skeleton (only for critical and strategic) */}
      {tier !== 'background' && (
        <div className={`mb-4 overflow-hidden rounded-lg -mx-6 -mt-6 ${tier === 'critical' ? 'h-64' : 'h-48'} bg-white/10 relative`}>
          <div className="absolute inset-0 animate-pulse" />
        </div>
      )}

      {/* Badge skeleton */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 bg-white/10 rounded-full animate-pulse" />
        {tier === 'critical' && (
          <div className="h-5 w-24 bg-[#E1463E]/20 rounded-full animate-pulse" />
        )}
      </div>

      {/* Header: Category + Type */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
          <div className="h-2 w-16 bg-white/5 rounded animate-pulse" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="mb-3 space-y-2">
        <div className="h-6 bg-white/10 rounded w-full animate-pulse" />
        <div className="h-6 bg-white/10 rounded w-3/4 animate-pulse" />
      </div>

      {/* Summary skeleton */}
      <div className={`mb-4 space-y-2 flex-grow ${tier === 'background' ? 'text-xs' : 'text-sm'}`}>
        <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
        <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
        {tier !== 'background' && (
          <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
        )}
      </div>

      {/* Consensus skeleton (only for strategic and critical) */}
      {tier !== 'background' && (
        <div className="mb-4">
          <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
        </div>
      )}

      {/* Reading time skeleton (only for strategic and critical) */}
      {tier !== 'background' && (
        <div className="mb-4">
          <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
        </div>
      )}

      {/* Tags skeleton */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
        <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
        <div className="h-6 w-14 bg-white/5 rounded animate-pulse" />
      </div>

      {/* Sources skeleton */}
      <div className="mb-4">
        <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
      </div>

      {/* Footer: Engagement + Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="h-8 w-8 bg-white/5 rounded-lg animate-pulse" />
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
