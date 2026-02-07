/**
 * Overview — Sémantique officielle des signaux et des layers.
 * Source unique pour produit + code. Ne pas dériver sans alignement.
 *
 * Rôle d'Overview : lecture macro instantanée du monde en 10–15 secondes.
 * Question unique : "Que se passe-t-il dans le monde en ce moment, et où sont les zones de tension ?"
 */

import type { OverviewSignalType } from '../types/overview';

/** Définition officielle : ce qu'est un signal sur la carte Global Situation */
export const OVERVIEW_SIGNAL_DEFINITION = {
  /** Un signal EST : un déséquilibre observable avec un impact potentiel global ou régional. */
  is: 'un déséquilibre observable avec un impact potentiel global ou régional',
  /** Un signal N'EST PAS : une news, une alerte, une hypothèse, un micro-événement. */
  isNot: ['une news', 'une alerte', 'une hypothèse', 'un micro-événement'],
} as const;

/** Une phrase par type de layer = angle de lecture du monde (pas un filtre technique). */
export const OVERVIEW_LAYER_SEMANTICS: Record<
  OverviewSignalType,
  { label: string; description: string; color: string }
> = {
  geopolitics:
    { label: 'Geopolitics', description: 'Décisions étatiques, conflits, sanctions, alignements.', color: '#ca8a04' },
  'supply-chains':
    { label: 'Supply Chains', description: 'Flux physiques : matières premières, nourriture, métaux.', color: '#ea580c' },
  markets:
    { label: 'Markets', description: 'Réactions financières visibles, volatilité, positions.', color: '#2563eb' },
  energy:
    { label: 'Energy', description: 'Routes, capacités, dépendances énergétiques.', color: '#d97706' },
  security:
    { label: 'Security', description: 'Risques armés, instabilité, coercition.', color: '#dc2626' },
};

/** Règle stricte : max signaux visibles sur la carte (répondre "où regarder" sans bruit). */
export const OVERVIEW_MAP_MAX_SIGNALS = 12;
