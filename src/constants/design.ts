/**
 * Design System Constants
 * Centralized design tokens for consistent styling across the application
 */

export const COLORS = {
  primary: {
    red: '#E1463E',
    redHover: 'rgba(225, 70, 62, 0.9)',
    redLight: 'rgba(225, 70, 62, 0.4)',
    redDark: 'rgba(225, 70, 62, 0.2)',
  },
  background: {
    base: '#0A0A0A',
    overlay: 'rgba(10, 10, 10, 0.8)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(148, 163, 184, 1)', // slate-400
    tertiary: 'rgba(100, 116, 139, 1)', // slate-500
    muted: 'rgba(71, 85, 105, 1)', // slate-600
    dark: 'rgba(51, 65, 85, 1)', // slate-700
  },
  borders: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.15)',
    strong: 'rgba(255, 255, 255, 0.2)',
  },
} as const;

export const TRANSITIONS = {
  fast: '150ms',
  medium: '300ms',
  slow: '500ms',
  verySlow: '700ms',
} as const;

export const ANIMATIONS = {
  duration: {
    fast: '150ms',
    medium: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'ease-in-out',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const SPACING = {
  section: {
    vertical: '6rem', // py-24
    verticalLarge: '8rem', // py-32
    horizontal: '1.5rem', // px-6
  },
  container: {
    sm: '48rem', // max-w-3xl
    md: '64rem', // max-w-5xl
    lg: '72rem', // max-w-6xl
    xl: '80rem', // max-w-7xl
  },
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    serif: ['Playfair Display', 'serif'],
  },
  weights: {
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.15em',
    wider: '0.2em',
    widest: '0.25em',
  },
} as const;

/**
 * Common CSS class combinations for reuse
 */
export const STYLES = {
  glass: {
    subtle: 'backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08]',
    medium: 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.12]',
    strong: 'backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.15]',
  },
  badge: {
    primary: 'inline-block backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-full px-4 sm:px-6 py-2 text-xs sm:text-sm text-[#E1463E] font-light tracking-[0.15em]',
  },
  button: {
    primary: 'px-6 sm:px-8 py-3 sm:py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-light text-sm sm:text-base tracking-wide rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#E1463E]/20 focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0A]',
    secondary: 'px-6 sm:px-8 py-3 sm:py-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] hover:border-white/[0.20] text-white font-light text-sm sm:text-base tracking-wide rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0A]',
  },
  card: {
    base: 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-white/[0.15] transition-all duration-300',
    interactive: 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-white/[0.15] hover:shadow-xl hover:shadow-white/[0.03] hover:-translate-y-1 transition-all duration-300 cursor-pointer',
  },
  input: {
    base: 'w-full px-4 py-3 bg-white/[0.05] border border-white/[0.10] rounded-lg text-white placeholder:text-slate-500 font-light text-sm focus:outline-none focus:border-[#E1463E]/50 focus:ring-1 focus:ring-[#E1463E]/20 transition-all duration-300',
  },
} as const;

