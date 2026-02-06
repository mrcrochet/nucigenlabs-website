/**
 * StatusBadge – shared analyst-grade indicator for relevance, credibility, warnings.
 * Aligns Search with Detective vocabulary and visual language.
 */

import { AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  type: 'relevance' | 'credibility' | 'warning';
  value: number; // 0–100 for relevance/credibility
  label?: string;
  showIcon?: boolean;
}

export function RelevanceBadge({ value, label = 'relevant' }: { value: number; label?: string }) {
  const pct = Math.round(value);
  return (
    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
      <span>{pct}% {label}</span>
    </span>
  );
}

export function CredibilityBadge({ value, label = 'credible' }: { value: number; label?: string }) {
  const pct = Math.round(value);
  const isLow = value < 50;
  return (
    <span className={`flex items-center gap-1.5 text-xs ${isLow ? 'text-amber-400' : 'text-text-secondary'}`}>
      {isLow && <AlertCircle className="w-3 h-3 shrink-0" aria-hidden />}
      <span>{pct}% {label}</span>
    </span>
  );
}

export function WarningBadge({ label = 'Unverified' }: { label?: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-amber-400">
      <AlertCircle className="w-3 h-3 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

export default function StatusBadge({ type, value, label, showIcon = true }: StatusBadgeProps) {
  if (type === 'relevance') {
    return <RelevanceBadge value={value} label={label} />;
  }
  if (type === 'credibility') {
    return <CredibilityBadge value={value} label={label} />;
  }
  if (type === 'warning') {
    return <WarningBadge label={label} />;
  }
  return null;
}
