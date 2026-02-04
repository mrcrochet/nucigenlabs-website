/**
 * Playground mock graph — Étape 1 : données mockées pour valider l’UI.
 * Utilisé quand ?mock=1 sur la page Réponse/Playground.
 * Voir plan : mock → backend → données réelles + temps réel.
 */

import type { InvestigationGraph } from '../../types/investigation-graph';

/** Graphe mock avec pistes actives, faibles et mortes (style enquête Soudan / or). */
export function getPlaygroundMockGraph(_query?: string): InvestigationGraph {
  return {
    nodes: [
      { id: 'mock-n1', type: 'event', label: 'RSF contrôle mines Jebel Amer', date: '2023-04-15', confidence: 85, sources: ['UN Security Council'] },
      { id: 'mock-n2', type: 'actor', label: 'UAE Gold Exports', date: null, confidence: 78, sources: ['Bloomberg'] },
      { id: 'mock-n3', type: 'resource', label: 'Darfur Gold Deposits', date: null, confidence: 92, sources: [] },
      { id: 'mock-n4', type: 'decision', label: 'UAE non-enforcement sanctions', date: '2023-06-20', confidence: 70, sources: ['Reuters'] },
      { id: 'mock-n5', type: 'actor', label: 'Rapid Support Forces', date: null, confidence: 88, sources: [] },
      { id: 'mock-n6', type: 'event', label: 'Mining licenses granted 2022', date: '2022-03-01', confidence: 65, sources: ['Local media'] },
      { id: 'mock-n7', type: 'actor', label: 'Wagner Group', date: null, confidence: 40, sources: ['AFP Fact Check'] },
    ],
    edges: [
      { from: 'mock-n1', to: 'mock-n3', relation: 'influences', strength: 0.85, confidence: 85 },
      { from: 'mock-n1', to: 'mock-n2', relation: 'supports', strength: 0.72, confidence: 72 },
      { from: 'mock-n4', to: 'mock-n2', relation: 'influences', strength: 0.65, confidence: 65 },
      { from: 'mock-n5', to: 'mock-n1', relation: 'causes', strength: 0.9, confidence: 88 },
      { from: 'mock-n6', to: 'mock-n2', relation: 'influences', strength: 0.5, confidence: 50 },
    ],
    paths: [
      {
        id: 'mock-path-1',
        nodes: ['mock-n5', 'mock-n1', 'mock-n3', 'mock-n2'],
        status: 'active',
        confidence: 78,
        hypothesis_label: "Contrôle des mines d'or du Darfour par les Émirats",
      },
      {
        id: 'mock-path-2',
        nodes: ['mock-n4', 'mock-n2'],
        status: 'active',
        confidence: 65,
        hypothesis_label: 'Financement indirect du conflit via commerce de l’or',
      },
      {
        id: 'mock-path-3',
        nodes: ['mock-n6', 'mock-n2'],
        status: 'weak',
        confidence: 42,
        hypothesis_label: 'Implication directe de l’Arabie Saoudite dans l’extraction',
      },
      {
        id: 'mock-path-4',
        nodes: ['mock-n7'],
        status: 'dead',
        confidence: 18,
        hypothesis_label: 'Connexion via mercenaires Wagner et or russe',
      },
    ],
  };
}
