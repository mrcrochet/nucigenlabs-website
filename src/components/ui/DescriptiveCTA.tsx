/**
 * Descriptive CTA — explicit value proposition (Corporate Impact style).
 * "Track & get notified on pressure changes" style line with optional action.
 */

import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DescriptiveCTAProps {
  /** Short value sentence */
  description: string;
  /** Button label, e.g. "Track & get notified" */
  actionLabel?: string;
  /** Route for the button (default: /alerts) */
  actionTo?: string;
  className?: string;
}

export default function DescriptiveCTA({
  description,
  actionLabel = 'Track & get notified',
  actionTo = '/alerts',
  className = '',
}: DescriptiveCTAProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 py-3 border-t border-gray-800/80 ${className}`}
      role="region"
      aria-label="Call to action"
    >
      <p className="text-sm text-gray-400">
        {description}
      </p>
      <Link
        to={actionTo}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-300 hover:bg-[#E1463E]/20 hover:border-[#E1463E]/30 hover:text-white text-sm font-medium transition-colors"
      >
        <Bell className="w-4 h-4" aria-hidden />
        {actionLabel}
      </Link>
    </div>
  );
}
