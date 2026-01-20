/**
 * Skeleton Event Card
 * 
 * Loading placeholder for event cards
 */

export default function SkeletonEvent() {
  return (
    <div className="p-4 bg-background-glass-subtle border border-borders-subtle rounded-lg animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-white/10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 bg-white/10 rounded" />
          <div className="h-4 w-1/2 bg-white/5 rounded" />
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full bg-white/5 rounded" />
        <div className="h-4 w-4/5 bg-white/5 rounded" />
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <div className="h-5 w-16 bg-white/5 rounded-full" />
        <div className="h-5 w-20 bg-white/5 rounded-full" />
        <div className="h-5 w-14 bg-white/5 rounded-full" />
      </div>
    </div>
  );
}
