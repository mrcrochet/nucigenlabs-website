/**
 * Skeleton Table
 * 
 * Loading placeholder for tables
 */

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export default function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="border border-borders-subtle rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid gap-4 p-4 bg-background-glass-subtle border-b border-borders-subtle" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-white/10 rounded animate-pulse" />
        ))}
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-borders-subtle">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 p-4 animate-pulse"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 bg-white/5 rounded"
                style={{ width: colIndex === 0 ? '60%' : colIndex === columns - 1 ? '40%' : '80%' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
