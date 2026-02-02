/**
 * Investigation View Onboarding — "Create New Investigation" first step
 * Shows 3 ways to see a network of leads (Flow, Timeline, Map). Not A→B: multiple paths, branches, dead ends.
 * Animated: paths draw in, nodes appear, subtle pulse — construction/reflection feel.
 */

import { useState } from 'react';
import { GitBranch, ListOrdered, Network } from 'lucide-react';

/* Animations: draw paths, reveal nodes, pulse for "active" reflection */
const mockAnimations = `
  @keyframes detective-draw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes detective-node-in {
    from { opacity: 0; transform: scale(0.4); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes detective-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.75; }
  }
  .detective-path {
    stroke-dasharray: 200;
    stroke-dashoffset: 200;
    animation: detective-draw 0.85s ease-out forwards;
  }
  .detective-path-delay-1 { animation-delay: 0.15s; }
  .detective-path-delay-2 { animation-delay: 0.3s; }
  .detective-path-delay-3 { animation-delay: 0.45s; }
  .detective-path-delay-4 { animation-delay: 0.6s; }
  .detective-path-delay-5 { animation-delay: 0.75s; }
  .detective-path-delay-6 { animation-delay: 0.9s; }
  .detective-path-slow {
    stroke-dasharray: 80;
    stroke-dashoffset: 80;
    animation: detective-draw 1s ease-out 0.2s forwards;
  }
  .detective-path-dashed {
    stroke-dasharray: 6 4;
    stroke-dashoffset: 60;
    animation: detective-draw 0.9s ease-out 0.5s forwards;
  }
  .detective-node {
    opacity: 0;
    animation: detective-node-in 0.4s ease-out forwards;
  }
  .detective-node-delay-1 { animation-delay: 0.1s; }
  .detective-node-delay-2 { animation-delay: 0.25s; }
  .detective-node-delay-3 { animation-delay: 0.4s; }
  .detective-node-delay-4 { animation-delay: 0.55s; }
  .detective-node-delay-5 { animation-delay: 0.7s; }
  .detective-node-delay-6 { animation-delay: 0.85s; }
  .detective-node-delay-7 { animation-delay: 1s; }
  .detective-node-pulse {
    animation: detective-pulse 2s ease-in-out infinite;
  }
  .detective-node-pulse-delay { animation-delay: 0.5s; }
`;

export type InvestigationViewMode = 'flow' | 'timeline' | 'map';

interface InvestigationViewOnboardingProps {
  onStart: (preferredView: InvestigationViewMode) => void;
  onBack?: () => void;
}

const VIEWS: Array<{
  id: InvestigationViewMode;
  title: string;
  description: string;
  microCopy: string;
  icon: React.ReactNode;
  Mock: React.FC;
  default?: boolean;
}> = [
  {
    id: 'flow',
    title: 'Flow View',
    description: 'See how multiple paths emerge and evolve.',
    microCopy: 'The agent explores several hypotheses in parallel.',
    icon: <GitBranch className="w-5 h-5" />,
    default: true,
    Mock: FlowViewMock,
  },
  {
    id: 'timeline',
    title: 'Timeline View',
    description: 'Follow how different leads develop over time.',
    microCopy: 'I see how the leads were built over time.',
    icon: <ListOrdered className="w-5 h-5" />,
    Mock: TimelineViewMock,
  },
  {
    id: 'map',
    title: 'Map View',
    description: 'Explore how actors and resources connect across leads.',
    microCopy: 'I see where investigations intersect.',
    icon: <Network className="w-5 h-5" />,
    Mock: MapViewMock,
  },
];

/** Multiple paths: one branch continues, one fades (dead end), one converges — animated construction. */
function FlowViewMock() {
  return (
    <div className="w-full h-[120px] rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-center p-2 font-mono text-[10px] text-gray-400 overflow-hidden">
      <svg viewBox="0 0 200 80" className="w-full h-full max-w-[180px]" fill="none" stroke="currentColor" strokeWidth="0.8">
        <path d="M 15 20 L 55 20" stroke="#22c55e" strokeWidth="1.2" className="detective-path" />
        <path d="M 15 40 L 55 40" stroke="#22c55e" strokeWidth="1" className="detective-path detective-path-delay-1" />
        <path d="M 15 60 L 55 60" stroke="#6b7280" strokeWidth="0.7" strokeOpacity="0.7" className="detective-path-dashed" />
        <path d="M 55 20 L 95 15 L 135 35" stroke="#22c55e" strokeWidth="1.2" className="detective-path detective-path-delay-2" />
        <path d="M 55 40 L 95 45 L 135 35" stroke="#22c55e" strokeWidth="1" className="detective-path detective-path-delay-3" />
        <path d="M 55 60 L 75 65" stroke="#6b7280" strokeWidth="0.6" strokeOpacity="0.5" className="detective-path detective-path-delay-5" style={{ strokeDasharray: '4 3' }} />
        <circle cx="15" cy="20" r="3" fill="#E1463E" className="detective-node" />
        <circle cx="15" cy="40" r="3" fill="#E1463E" className="detective-node detective-node-delay-1" />
        <circle cx="15" cy="60" r="3" fill="#6b7280" fillOpacity="0.6" className="detective-node detective-node-delay-2" />
        <circle cx="55" cy="20" r="2.5" fill="#374151" className="detective-node detective-node-delay-2" />
        <circle cx="55" cy="40" r="2.5" fill="#374151" className="detective-node detective-node-delay-3" />
        <circle cx="55" cy="60" r="2" fill="#6b7280" fillOpacity="0.5" className="detective-node detective-node-delay-3" />
        <circle cx="95" cy="15" r="2.5" fill="#22c55e" className="detective-node detective-node-delay-4" />
        <circle cx="95" cy="45" r="2.5" fill="#22c55e" className="detective-node detective-node-delay-4" />
        <circle cx="135" cy="35" r="3.5" fill="#E1463E" className="detective-node detective-node-delay-5 detective-node-pulse" />
      </svg>
    </div>
  );
}

/** Multiple leads over time: parallel threads — events appear in sequence, links draw. */
function TimelineViewMock() {
  return (
    <div className="w-full h-[120px] rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-center p-2 font-mono text-[10px] text-gray-400 overflow-hidden">
      <svg viewBox="0 0 160 100" className="w-full h-full max-w-[160px]" fill="none" stroke="currentColor" strokeWidth="0.8">
        <line x1="45" y1="12" x2="45" y2="88" strokeDasharray="3 2" stroke="#374151" className="detective-path" />
        <line x1="80" y1="12" x2="80" y2="88" strokeDasharray="3 2" stroke="#374151" className="detective-path detective-path-delay-1" />
        <line x1="115" y1="12" x2="115" y2="88" strokeDasharray="3 2" stroke="#374151" className="detective-path detective-path-delay-2" />
        <line x1="45" y1="45" x2="80" y2="55" stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2 2" className="detective-path detective-path-delay-4" />
        <line x1="80" y1="55" x2="115" y2="62" stroke="#22c55e" strokeWidth="0.6" className="detective-path detective-path-delay-5" />
        <circle cx="45" cy="18" r="3" fill="#E1463E" className="detective-node" />
        <circle cx="45" cy="45" r="2.5" fill="#6b7280" className="detective-node detective-node-delay-2" />
        <circle cx="45" cy="72" r="2.5" fill="#22c55e" className="detective-node detective-node-delay-4" />
        <circle cx="80" cy="22" r="2.5" fill="#6b7280" className="detective-node detective-node-delay-1" />
        <circle cx="80" cy="55" r="3" fill="#E1463E" className="detective-node detective-node-delay-3 detective-node-pulse" />
        <circle cx="80" cy="78" r="2.5" fill="#22c55e" className="detective-node detective-node-delay-5" />
        <circle cx="115" cy="30" r="2.5" fill="#6b7280" className="detective-node detective-node-delay-3" />
        <circle cx="115" cy="62" r="2.5" fill="#22c55e" className="detective-node detective-node-delay-6" />
      </svg>
    </div>
  );
}

/** Actors/nodes and links across leads — center pulses, links draw out to nodes. */
function MapViewMock() {
  return (
    <div className="w-full h-[120px] rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-center p-2 font-mono text-[10px] text-gray-400 overflow-hidden">
      <svg viewBox="0 0 120 100" className="w-full h-full max-w-[140px]" fill="none" stroke="currentColor" strokeWidth="0.8">
        <line x1="60" y1="50" x2="28" y2="22" stroke="#22c55e" strokeWidth="0.8" className="detective-path" />
        <line x1="60" y1="50" x2="92" y2="22" stroke="#6b7280" strokeWidth="0.7" className="detective-path detective-path-delay-1" />
        <line x1="60" y1="50" x2="28" y2="78" stroke="#6b7280" strokeWidth="0.7" className="detective-path detective-path-delay-2" />
        <line x1="60" y1="50" x2="92" y2="78" stroke="#22c55e" strokeWidth="0.8" className="detective-path detective-path-delay-3" />
        <line x1="28" y1="22" x2="92" y2="78" stroke="#374151" strokeWidth="0.4" strokeDasharray="2 2" className="detective-path detective-path-delay-5" />
        <circle cx="60" cy="50" r="7" fill="#1f2937" stroke="#E1463E" strokeWidth="1.2" className="detective-node detective-node-pulse" />
        <circle cx="28" cy="22" r="4" fill="#374151" className="detective-node detective-node-delay-2" />
        <circle cx="92" cy="22" r="4" fill="#374151" className="detective-node detective-node-delay-2" />
        <circle cx="28" cy="78" r="4" fill="#374151" className="detective-node detective-node-delay-3" />
        <circle cx="92" cy="78" r="4" fill="#374151" className="detective-node detective-node-delay-3" />
      </svg>
    </div>
  );
}

export default function InvestigationViewOnboarding({ onStart, onBack }: InvestigationViewOnboardingProps) {
  const [selectedView, setSelectedView] = useState<InvestigationViewMode>('flow');
  const [replayKeys, setReplayKeys] = useState<Record<InvestigationViewMode, number>>({ flow: 0, timeline: 0, map: 0 });

  const handleCardMouseEnter = (viewId: InvestigationViewMode) => {
    setReplayKeys((prev) => ({ ...prev, [viewId]: (prev[viewId] ?? 0) + 1 }));
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto">
      <style dangerouslySetInnerHTML={{ __html: mockAnimations }} />
      {/* Headline */}
      <div className="text-center mb-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">
          Start a new investigation
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          An agent will explore multiple possible paths and update them over time.
        </p>
        <p className="text-text-muted text-xs mt-2 italic">
          Same investigation. Different perspectives.
        </p>
      </div>

      {/* 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setSelectedView(view.id)}
            onMouseEnter={() => handleCardMouseEnter(view.id)}
            className={`relative text-left rounded-xl border-2 transition-all duration-200 p-4 flex flex-col gap-3 ${
              selectedView === view.id
                ? 'border-[#E1463E] bg-[#E1463E]/5 shadow-lg shadow-[#E1463E]/10'
                : 'border-borders-subtle bg-background-base hover:border-[#E1463E]/40 hover:bg-borders-subtle/30'
            }`}
          >
            {view.default && selectedView === view.id && (
              <span className="absolute top-3 right-3 text-[10px] font-medium uppercase tracking-wider text-[#E1463E] bg-[#E1463E]/10 px-2 py-0.5 rounded">
                Default view
              </span>
            )}
            <div className="flex items-center gap-2 text-[#E1463E]">
              {view.icon}
              <span className="font-semibold text-text-primary text-sm">{view.title}</span>
            </div>
            <div key={`${view.id}-${replayKeys[view.id]}`} className="min-h-[120px] flex-shrink-0">
              <view.Mock />
            </div>
            <p className="text-text-secondary text-xs leading-snug">
              {view.description}
            </p>
            <p className="text-text-muted text-[11px]">
              {view.microCopy}
            </p>
          </button>
        ))}
      </div>

      {/* Reassurance — non-linear product truth */}
      <p className="text-center text-text-muted text-xs mt-5 max-w-xl mx-auto">
        Investigations are non-linear. Paths can branch, merge, or disappear. You can switch views anytime.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-lg border border-borders-subtle text-text-secondary hover:bg-borders-subtle text-sm font-medium"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => onStart(selectedView)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E1463E] hover:bg-[#E1463E]/90 text-white text-sm font-medium transition-colors"
        >
          Start investigation
        </button>
      </div>
    </div>
  );
}
