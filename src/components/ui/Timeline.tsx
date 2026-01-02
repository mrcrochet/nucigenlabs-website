/**
 * Timeline Component - Shared UI component for causal chain visualization
 */

interface TimelineItem {
  label: string;
  content: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export default function Timeline({ items, className = '' }: TimelineProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {items.map((item, index) => (
        <div key={index}>
          <div className="text-xs text-slate-600 mb-2 font-light uppercase tracking-wide">
            {item.label}
          </div>
          <p className="text-base text-white font-light leading-relaxed">
            {item.content}
          </p>
          {index < items.length - 1 && (
            <div className="flex items-center justify-center py-4">
              <div className="w-px h-8 bg-white/10"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

