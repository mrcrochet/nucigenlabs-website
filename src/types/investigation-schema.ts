/**
 * Schéma de données — Investigation Engine (V1).
 * See docs/SCHEMA_INVESTIGATION_ENGINE.md.
 *
 * On persiste un état d'investigation évolutif, pas une réponse.
 * Dates: ISO strings (DB/API).
 */

export type InvestigationStatus = 'ongoing' | 'paused' | 'closed';

/** Conteneur logique — une enquête est un espace de travail. */
export interface Investigation {
  id: string;
  title: string;
  hypothesis: string;
  status: InvestigationStatus;
  created_at: string;
  updated_at: string;
}

/** Observations brutes (input). Immutables après ingestion. */
export interface Signal {
  id: string;
  investigation_id: string;
  source: string;
  source_url?: string | null;
  published_at?: string | null;
  extracted_at: string;
  credibility: number; // 0..1
  raw_text: string;
}

export type NodeType = 'event' | 'actor' | 'resource' | 'decision' | 'impact';

/** Faits / événements / acteurs normalisés — matière du graphe. */
export interface Node {
  id: string;
  investigation_id: string;
  type: NodeType;
  label: string;
  date?: string | null;
  confidence: number; // 0..1
}

export type EdgeRelation = 'causes' | 'influences' | 'restricts' | 'supports' | 'weakens';

/** Relations causales / d'influence — servent à inférer les paths. */
export interface Edge {
  id: string;
  investigation_id: string;
  from_node_id: string;
  to_node_id: string;
  relation: EdgeRelation;
  strength: number; // 0..1
  confidence: number; // 0..1
}

export type PathStatus = 'active' | 'weak' | 'dead';

/** Hypothèses causales en concurrence (output clé du moteur). confidence = 0..100 (affichage). */
export interface Path {
  id: string;
  investigation_id: string;
  status: PathStatus;
  confidence: number; // 0..100
  hypothesis_label?: string | null;
  created_at: string;
  updated_at: string;
}

/** Appartenance node ↔ path ; position = ordre local dans le path. */
export interface PathNode {
  path_id: string;
  node_id: string;
  position: number;
}
