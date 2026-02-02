/**
 * Briefing View — Option B UX. Chapters + navigation.
 * Consumes BriefingPayload only; no long narrative. See docs/BRIEFING_MODEL.md.
 */

import type { BriefingPayload } from '../../types/briefing';

const CHAPTER_IDS = [
  'investigation',
  'primary-path',
  'turning-points',
  'alternatives',
  'uncertainty',
  'disclaimer',
] as const;

const CHAPTER_LABELS: Record<(typeof CHAPTER_IDS)[number], string> = {
  investigation: 'What is being investigated',
  'primary-path': 'Primary path',
  'turning-points': 'Key turning points',
  alternatives: 'Alternative explanations',
  uncertainty: 'What is uncertain',
  disclaimer: 'Disclaimer',
};

export interface InvestigationBriefingViewProps {
  payload: BriefingPayload;
  onPathClick?: (pathId: string) => void;
  className?: string;
}

function scrollToChapter(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function InvestigationBriefingView({
  payload,
  onPathClick,
  className = '',
}: InvestigationBriefingViewProps) {
  const { investigation, primary_path, turning_points, alternative_paths, uncertainty, disclaimer } = payload;

  return (
    <div className={`rounded-xl border border-borders-subtle bg-background-base overflow-hidden flex flex-col ${className}`}>
      <div className="shrink-0 p-3 border-b border-borders-subtle flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider mr-2">Chapters</span>
        {CHAPTER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollToChapter(id)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-borders-subtle text-text-secondary hover:bg-[#E1463E]/10 hover:text-[#E1463E] transition-colors"
          >
            {CHAPTER_LABELS[id]}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-8 max-h-[60vh]">
        {/* 1. What is being investigated */}
        <section id="investigation" className="scroll-mt-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">{CHAPTER_LABELS.investigation}</h2>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-text-primary">{investigation.title}</p>
            <p className="text-text-secondary leading-relaxed">{investigation.hypothesis}</p>
            <p className="text-xs text-text-muted">
              Status: {investigation.status} · Updated: {new Date(investigation.updated_at).toLocaleDateString()}
            </p>
            {investigation.investigative_axes.length > 0 && (
              <ul className="list-disc list-inside text-text-secondary">
                {investigation.investigative_axes.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 2. Primary path */}
        <section id="primary-path" className="scroll-mt-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">{CHAPTER_LABELS['primary-path']}</h2>
          {primary_path ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onPathClick?.(primary_path.path_id)}
                className="text-left w-full rounded-lg border border-borders-subtle p-3 hover:border-[#E1463E]/40 hover:bg-[#E1463E]/5 transition-colors"
              >
                <p className="font-medium text-text-primary">{primary_path.hypothesis_label}</p>
                <p className="text-xs text-text-muted mt-1">
                  {primary_path.status} · {primary_path.confidence} %
                </p>
                {primary_path.key_node_ids.length > 0 && (
                  <p className="text-xs text-text-secondary mt-1">
                    Key nodes: {primary_path.key_node_ids.length} (click to open in panel)
                  </p>
                )}
              </button>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No path derived yet. Add signals to build paths.</p>
          )}
        </section>

        {/* 3. Key turning points */}
        <section id="turning-points" className="scroll-mt-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">{CHAPTER_LABELS['turning-points']}</h2>
          {turning_points.length > 0 ? (
            <ul className="space-y-2">
              {turning_points.map((tp) => (
                <li
                  key={tp.node_id}
                  className="rounded-lg border border-borders-subtle p-2.5 text-sm text-text-primary"
                >
                  <span className="font-medium">{tp.label}</span>
                  {tp.date && <span className="text-text-muted ml-2">{tp.date}</span>}
                  <span className="text-text-muted ml-2">{tp.confidence} %</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No turning points identified yet.</p>
          )}
        </section>

        {/* 4. Alternative explanations */}
        <section id="alternatives" className="scroll-mt-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">{CHAPTER_LABELS.alternatives}</h2>
          {alternative_paths.length > 0 ? (
            <ul className="space-y-2">
              {alternative_paths.map((p) => (
                <li key={p.path_id}>
                  <button
                    type="button"
                    onClick={() => onPathClick?.(p.path_id)}
                    className="text-left w-full rounded-lg border border-borders-subtle p-2.5 hover:border-[#E1463E]/40 hover:bg-[#E1463E]/5 transition-colors"
                  >
                    <span className="font-medium text-text-primary block">{p.hypothesis_label}</span>
                    <span className="text-xs text-text-muted">
                      {p.status} · {p.confidence} %
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No alternative paths yet.</p>
          )}
        </section>

        {/* 5. What is uncertain */}
        <section id="uncertainty" className="scroll-mt-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">{CHAPTER_LABELS.uncertainty}</h2>
          <div className="space-y-2 text-sm">
            {uncertainty.blind_spots.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase mb-1">Blind spots</p>
                <ul className="list-disc list-inside text-text-secondary">
                  {uncertainty.blind_spots.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {uncertainty.low_confidence_node_ids.length > 0 && (
              <p className="text-text-secondary">
                {uncertainty.low_confidence_node_ids.length} node(s) with low confidence
              </p>
            )}
            {uncertainty.has_contradictions && (
              <p className="text-[#E1463E] font-medium">Contradictions or weak evidence detected.</p>
            )}
            {!uncertainty.blind_spots.length &&
              !uncertainty.low_confidence_node_ids.length &&
              !uncertainty.has_contradictions && (
                <p className="text-text-muted">No explicit uncertainties flagged.</p>
              )}
          </div>
        </section>

        {/* 6. Disclaimer */}
        <section id="disclaimer" className="scroll-mt-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">{CHAPTER_LABELS.disclaimer}</h2>
          <p className="text-xs text-text-muted italic leading-relaxed">{disclaimer}</p>
        </section>
      </div>
    </div>
  );
}
