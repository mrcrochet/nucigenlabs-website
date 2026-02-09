/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Design Tokens - Colors
      colors: {
        primary: {
          DEFAULT: '#E1463E',
          hover: 'rgba(225, 70, 62, 0.9)',
          light: 'rgba(225, 70, 62, 0.4)',
          dark: 'rgba(225, 70, 62, 0.2)',
        },
        background: {
          base: '#0A0A0A',
          overlay: 'rgba(10, 10, 10, 0.8)',
          elevated: '#0F0F0F',
          glass: {
            subtle: 'rgba(255, 255, 255, 0.03)',
            medium: 'rgba(255, 255, 255, 0.05)',
            strong: 'rgba(255, 255, 255, 0.08)',
          },
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.15)',
          strong: 'rgba(255, 255, 255, 0.2)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: 'rgba(148, 163, 184, 1)',
          tertiary: 'rgba(100, 116, 139, 1)',
        },
        borders: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.15)',
          strong: 'rgba(255, 255, 255, 0.2)',
        },
        // Analyst / Detective UI – same spectrum as Search workspace & Investigation
        // Use for: Search, Detective, Intelligence, any analyst-grade view
        analyst: {
          bg: '#000000',
          'bg-panel': 'rgba(17, 24, 39, 0.3)',   /* gray-900/30 */
          'bg-surface': 'rgb(31, 41, 55)',       /* gray-800 */
          'bg-hover': 'rgb(17, 24, 39)',          /* gray-900 */
          border: 'rgb(31, 41, 55)',              /* gray-800 */
          'border-light': 'rgb(55, 65, 81)',     /* gray-700 */
          'border-section': 'rgb(17, 24, 39)',   /* gray-900 */
          'text-primary': 'rgb(229, 231, 235)',  /* gray-200 */
          'text-secondary': 'rgb(209, 213, 219)', /* gray-300 */
          'text-muted': 'rgb(156, 163, 175)',    /* gray-400 */
          'text-tertiary': 'rgb(107, 114, 128)', /* gray-500 */
          'text-quiet': 'rgb(75, 85, 99)',       /* gray-600 */
          accent: 'rgb(248, 113, 113)',          /* red-400 */
          'accent-strong': 'rgb(239, 68, 68)',   /* red-500 */
          'accent-soft': 'rgba(127, 29, 29, 0.2)',  /* red-900/20 */
          'accent-soft-border': 'rgba(127, 29, 29, 0.5)',
          relevance: 'rgb(34, 197, 94)',        /* green-500 */
          credibility: 'rgb(251, 191, 36)',      /* amber-400 */
          'credibility-icon': 'rgb(245, 158, 11)', /* amber-500 */
        },
      },
      // Typography
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.6' }],
        'base': ['1rem', { lineHeight: '1.7' }],
        'lg': ['1.125rem', { lineHeight: '1.7' }],
        'xl': ['1.25rem', { lineHeight: '1.7' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.2' }],
        '4xl': ['2.25rem', { lineHeight: '1.1' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '7xl': ['4.5rem', { lineHeight: '1.1' }],
        '8xl': ['6rem', { lineHeight: '1.1' }],
      },
      // Spacing - Consistent spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Border Radius
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
      },
      // Shadows
      boxShadow: {
        'glow-red': '0 0 35px rgba(225, 70, 62, 0.4)',
        'glow-red-sm': '0 0 25px rgba(225, 70, 62, 0.35)',
        'glow-red-lg': '0 0 50px rgba(225, 70, 62, 0.5)',
        'subtle': '0 1px 0 0 rgba(255,255,255,0.02)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      // Animations
      keyframes: {
        'slide-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
            maxHeight: '0',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
            maxHeight: '5000px',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      // Backdrop Blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
      },
      // Transitions
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
    },
  },
  plugins: [],
};
