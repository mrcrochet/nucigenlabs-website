/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'nucigen': {
          'red': '#E1463E',
          'bg-primary': '#0B0F14',
          'bg-secondary': '#0F1623',
          'bg-tertiary': '#141B2D',
          'text-primary': '#F4F6F8',
          'text-secondary': '#C9D1E1',
          'text-tertiary': '#8B93A7',
          'border': '#1F2937',
          'border-subtle': '#2A324A',
        },
      },
      spacing: {
        'section-v': '120px',
        'section-v-lg': '160px',
        'section-h': '64px',
        'section-h-lg': '96px',
      },
    },
  },
  plugins: [],
};
