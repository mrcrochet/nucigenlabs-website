/**
 * Skeleton Card Component
 * 
 * Loading placeholder for cards
 */

export default function SkeletonCard() {
  return (
    <div className="p-4 sm:p-6 bg-white/[0.02] border border-white/[0.08] rounded-xl animate-pulse transition-opacity duration-300">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="h-6 bg-white/10 rounded-lg w-3/4 mb-3"></div>
          <div className="h-4 bg-white/5 rounded-lg w-full mb-2"></div>
          <div className="h-4 bg-white/5 rounded-lg w-5/6"></div>
        </div>
        <div className="h-8 w-20 bg-white/10 rounded-lg"></div>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="h-4 w-24 bg-white/5 rounded"></div>
        <div className="h-4 w-24 bg-white/5 rounded"></div>
        <div className="h-4 w-24 bg-white/5 rounded"></div>
      </div>
    </div>
  );
}
