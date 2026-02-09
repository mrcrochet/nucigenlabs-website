/**
 * Nucigen Labs — Overview color system
 * Palette dark / orange / gold; Markets = purple/magenta (no blue).
 * Use for layers, markers, UI accents, glow, hover states.
 */

import type { OverviewSignalType } from '../types/overview';

/** Layer colors — single source of truth (aligned with CSS variables) */
export const OVERVIEW_LAYER_COLORS: Record<OverviewSignalType, { main: string; light: string }> = {
  geopolitics: { main: '#F9B234', light: '#FFC857' },
  'supply-chains': { main: '#FF6B35', light: '#F77F00' },
  markets: { main: '#D946EF', light: '#C026D3' },
  energy: { main: '#FBBF24', light: '#FB923C' },
  security: { main: '#EF4444', light: '#DC2626' },
};

/** UI accent (focus/highlights only) */
export const ACCENT_UI = '#06B6D4';

/** Background gradient endpoints */
export const BG_DARK = '#0A0A0F';
export const BG_NAVY = '#0F1419';

export function getLayerColor(type: OverviewSignalType, variant: 'main' | 'light' = 'main'): string {
  return OVERVIEW_LAYER_COLORS[type]?.[variant] ?? '#71717a';
}

/** Glow color for markers (same as main, used in box-shadow) */
export function getLayerGlowColor(type: OverviewSignalType): string {
  return getLayerColor(type, 'main');
}

/** Hover: increase perceived brightness via opacity/light variant */
export function getLayerHoverColor(type: OverviewSignalType): string {
  return getLayerColor(type, 'light');
}

/** CSS box-shadow for marker glow (blur 20px) */
export function getMarkerGlowShadow(type: OverviewSignalType): string {
  const hex = getLayerGlowColor(type);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `0 0 20px rgba(${r},${g},${b},0.5)`;
}

/** Marker size band by importance (0–100): small 40px, medium 60px, large 80px */
export function importanceToMarkerSizePx(importance: number): number {
  if (importance >= 67) return 80;
  if (importance >= 34) return 60;
  return 40;
}
