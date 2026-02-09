/**
 * How we validate — panel explaining recalibration & back-testing (board-ready credibility).
 * Used on Scenarios (Impacts) and Markets / Overview.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';

interface HowWeValidateProps {
  /** Title override */
  title?: string;
  /** "scenarios" | "markets" for preset content */
  variant: 'scenarios' | 'markets';
  className?: string;
}

const CONTENT = {
  scenarios: {
    title: 'How we validate scenarios',
    points: [
      'Scenarios are generated from event-driven signals and causal chains, then scored for probability and magnitude.',
      'We recalibrate assumptions when new evidence appears and back-test pathways against historical outcomes where data exists.',
      'Results are indicative only and do not constitute investment advice.',
    ],
  },
  markets: {
    title: 'How we validate market data',
    points: [
      'Market metrics and movers are sourced from configured providers and refreshed on a schedule.',
      'We apply consistency checks and outlier filters; methodology is documented for audit.',
      'Past performance and back-tests do not guarantee future results.',
    ],
  },
};

export default function HowWeValidate({ title, variant, className = '' }: HowWeValidateProps) {
  const [open, setOpen] = useState(false);
  const config = CONTENT[variant];
  const displayTitle = title ?? config.title;

  return (
    <div
      className={`rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden ${className}`}
      role="region"
      aria-label={displayTitle}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#E1463E]/10">
            <Shield className="w-4 h-4 text-[#E1463E]" aria-hidden />
          </div>
          <span className="text-sm font-semibold text-white">{displayTitle}</span>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06]">
          <ul className="space-y-2 mt-3">
            {config.points.map((point, i) => (
              <li key={i} className="text-sm text-slate-400 leading-relaxed flex items-start gap-2">
                <span className="text-[#E1463E] mt-1 shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
