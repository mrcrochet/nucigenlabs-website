/**
 * Design Utility Functions
 * 
 * Helper functions for consistent design patterns
 */

/**
 * Get contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast calculation
  // In production, use a proper color contrast library
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(color: string): number {
  // Simplified - in production use proper color parsing
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (!rgb) return 0.5;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  return 0.5; // Default fallback
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check if text color meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
  textColor: string,
  backgroundColor: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(textColor, backgroundColor);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Get appropriate text color for a background
 */
export function getTextColorForBackground(
  backgroundColor: string
): 'text-white' | 'text-slate-100' | 'text-slate-200' | 'text-slate-300' {
  // For dark backgrounds (#0A0A0A, #0F0F0F), use white/light colors
  if (backgroundColor.includes('#0A0A0A') || backgroundColor.includes('#0F0F0F')) {
    return 'text-white';
  }
  
  // For glass/transparent backgrounds, use lighter text
  if (backgroundColor.includes('rgba') || backgroundColor.includes('white/')) {
    return 'text-slate-200';
  }
  
  return 'text-slate-300';
}

/**
 * Get spacing value from design tokens
 */
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const;

/**
 * Get border radius value from design tokens
 */
export const borderRadius = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  full: '9999px',
} as const;
