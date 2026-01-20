/**
 * Skeleton Signal Card
 * 
 * Loading placeholder for signal cards
 */

export default function SkeletonSignal() {
  return (
    <div className="p-6 bg-background-glass-subtle border border-borders-subtle rounded-xl animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-full" />
          <div className="space-y-2">
            <div className="h-5 w-48 bg-white/10 rounded" />
            <div className="h-4 w-32 bg-white/5 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-white/10 rounded-full" />
          <div className="h-6 w-20 bg-white/10 rounded-full" />
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="h-4 w-full bg-white/5 rounded" />
        <div className="h-4 w-5/6 bg-white/5 rounded" />
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-borders-subtle">
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-white/5 rounded" />
          <div className="h-4 w-20 bg-white/5 rounded" />
        </div>
        <div className="h-8 w-24 bg-white/10 rounded" />
      </div>
    </div>
  );
}
