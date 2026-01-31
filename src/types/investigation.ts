/**
 * Types for Nucigen Intelligence Detective — Investigation Threads
 * See CONCEPTION_INTELLIGENCE_DETECTIVE.md and NUCIGEN_INTELLIGENCE_DETECTIVE.md
 */

export type InvestigationScope = 'geopolitics' | 'commodities' | 'security' | 'finance';

export type ThreadStatus = 'active' | 'dormant' | 'closed';

export type SignalType = 'article' | 'report' | 'testimony' | 'data' | 'sanction' | 'seizure';

export type CredibilityScore = 'A' | 'B' | 'C' | 'D';

export type ImpactOnHypothesis = 'supports' | 'weakens' | 'neutral';

export type CurrentAssessment = 'supported' | 'partially_supported' | 'unclear' | 'contradicted';

export type CausalMechanism = 'funding' | 'trafficking' | 'influence' | 'logistics';

/** Piste d'enquête */
export interface InvestigationThread {
  id: string;
  user_id: string;
  title: string;
  initial_hypothesis: string;
  scope: InvestigationScope;
  status: ThreadStatus;
  confidence_score: number;
  investigative_axes: string[];
  current_assessment?: CurrentAssessment | null;
  blind_spots: string[];
  created_at: string;
  updated_at: string;
}

/** Signal (preuve / élément) */
export interface InvestigationSignal {
  id: string;
  thread_id: string;
  type: SignalType;
  source: string;
  url?: string | null;
  date?: string | null;
  actors: string[];
  summary: string;
  credibility_score?: CredibilityScore | null;
  extracted_facts: string[];
  impact_on_hypothesis?: ImpactOnHypothesis | null;
  raw_evidence?: Record<string, unknown> | null;
  created_at: string;
}

/** Message chat (user / assistant) */
export interface InvestigationMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: string[];
  evidence_snapshot?: EvidenceItem[] | null;
  created_at: string;
}

/** Evidence item (excerpt scraped, used in chat and in raw_evidence) */
export interface EvidenceItem {
  url: string;
  title: string;
  excerpt: string;
}

/** Lien causal (Phase 4) */
export interface InvestigationCausalLink {
  id: string;
  thread_id: string;
  from_actor: string;
  to_actor: string;
  mechanism: CausalMechanism;
  confidence: number;
  evidence_signal_ids: string[];
  created_at: string;
}

/** État de l'hypothèse (dérivé ou stocké) */
export interface HypothesisState {
  thread_id: string;
  current_assessment: CurrentAssessment;
  confidence_delta: number;
  blind_spots: string[];
  last_updated: string;
}

/** Payload création de piste */
export interface CreateThreadPayload {
  initial_hypothesis: string;
  title?: string;
  scope?: InvestigationScope;
}

/** Payload envoi message */
export interface SendMessagePayload {
  content: string;
}
