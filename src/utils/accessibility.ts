/**
 * Accessibility utilities
 * Helper functions for improving accessibility
 */

/**
 * Get accessible focus styles
 */
export const getFocusStyles = (color: string = '#E1463E') => ({
  outline: 'none',
  ring: `2px solid ${color}50`,
  ringOffset: '2px',
  ringOffsetColor: '#0A0A0A',
});

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get transition duration based on user preferences
 */
export const getTransitionDuration = (duration: string = '300ms'): string => {
  if (prefersReducedMotion()) {
    return '0ms';
  }
  return duration;
};

/**
 * Generate ARIA label for icon-only buttons
 */
export const getAriaLabel = (action: string, target?: string): string => {
  if (target) {
    return `${action} ${target}`;
  }
  return action;
};

/**
 * Format number for screen readers
 */
export const formatNumberForScreenReader = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} thousand`;
  }
  return num.toString();
};

