/**
 * Briefing data model — Option B. Read-only contract.
 * See docs/BRIEFING_MODEL.md.
 *
 * The Briefing reads paths, nodes, edges. It does not create, modify, or choose truth.
 */

import type { InvestigationGraph } from './investigation-graph';
import type { InvestigationThread } from './investigation';

/** Input: thread + graph. Read-only; never mutated. */
export interface BriefingInput {
  thread: InvestigationThread;
  graph: InvestigationGraph;
}

/** Section 1: What is being investigated */
export interface BriefingSectionInvestigation {
  hypothesis: string;
  title: string;
  status: string;
  updated_at: string;
  investigative_axes: string[];
}

/** Section 2: Primary path (current best explanation). Never "the truth". */
export interface BriefingSectionPrimaryPath {
  path_id: string;
  hypothesis_label: string;
  confidence: number;
  status: string;
  key_node_ids: string[];
}

/** Section 3: Key turning points — 2–4 pivot nodes */
export interface BriefingTurningPoint {
  node_id: string;
  label: string;
  date?: string | null;
  confidence: number;
}

/** Section 4: Alternative explanations (weak + dead paths) */
export interface BriefingAlternativePath {
  path_id: string;
  hypothesis_label: string;
  status: string;
  confidence: number;
}

/** Section 5: What is uncertain */
export interface BriefingSectionUncertainty {
  blind_spots: string[];
  low_confidence_node_ids: string[];
  has_contradictions: boolean;
}

/** Full payload for UI or export. Structured data only; no long generated text. */
export interface BriefingPayload {
  /** Section 1 */
  investigation: BriefingSectionInvestigation;
  /** Section 2 */
  primary_path: BriefingSectionPrimaryPath | null;
  /** Section 3 */
  turning_points: BriefingTurningPoint[];
  /** Section 4 */
  alternative_paths: BriefingAlternativePath[];
  /** Section 5 */
  uncertainty: BriefingSectionUncertainty;
  /** Section 6: disclaimer (fixed phrase) */
  disclaimer: string;
}
