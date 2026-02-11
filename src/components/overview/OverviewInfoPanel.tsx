/**
 * OverviewInfoPanel – Custom panel anchored to map coordinates via projection.
 * No Mapbox Popup; positioned with transform: translate(-50%, -100%) for stable anchor.
 */

import { useNavigate } from 'react-router-dom';
import type { OverviewSignal } from '../../types/overview';
import { OVERVIEW_LAYER_SEMANTICS } from '../../constants/overview-signals';
import { getLayerColor } from '../../utils/colorSystem';

export interface OverviewInfoPanelProps {
  signal: OverviewSignal;
  x: number;
  y: number;
  isVisible: boolean;
  onClose: () => void;
}

export default function OverviewInfoPanel({
  signal,
  x,
  y,
  isVisible,
  onClose,
}: OverviewInfoPanelProps) {
  const navigate = useNavigate();
  const color = getLayerColor(signal.type, 'main');
  const meta = OVERVIEW_LAYER_SEMANTICS[signal.type];

  if (!isVisible) return null;

  return (
    <div
      className="absolute z-10 pointer-events-auto animate-in fade-in duration-200"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)',
        marginTop: -8,
      }}
    >
      <div
        className="min-w-[220px] max-w-[280px] rounded-xl overflow-hidden shadow-2xl border bg-black/90 backdrop-blur-xl"
        style={{ borderColor: `${color}50` }}
      >
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: `${meta.color}25`,
                color: meta.color,
                border: `1px solid ${meta.color}40`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {meta.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 text-lg leading-none -mt-1"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          <div className="font-medium text-gray-100 text-sm leading-tight">
            {signal.label_short}
          </div>
          <div className="text-gray-400 mt-0.5 text-xs">{signal.subtitle_short}</div>
          <div className="mt-2 pt-2 border-t border-white/10">
            <span className="text-gray-500 text-xs">Impact:</span>{' '}
            <span className="text-gray-300 text-xs">{signal.impact_one_line}</span>
          </div>
          <div className="mt-2 text-[10px] text-gray-500">
            Confidence: <span className="font-mono text-gray-400">{signal.confidence}%</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(signal.investigate_id || '/search')}
            className="mt-3 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-cyan-500/15 text-cyan-300 text-xs font-medium border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
          >
            Investigate
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
