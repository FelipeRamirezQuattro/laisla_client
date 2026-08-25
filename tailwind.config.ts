import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ═══ BRAND — La Isla · Café Picnic, 5 colors. ═══
        'island-blue': '#2B3FBE',  // cup/mascot blue · "La Isla" wordmark · primary CTA
        'sun-yellow':  '#F5A623',  // palm · "CAFÉ PICNIC" · secondary accent
        'island-dark': '#1A2480',  // dark text · hover states · deep backgrounds
        sand:          '#F5E6D3',  // cream/skin illustration tone · section backgrounds
        // white — use Tailwind's built-in `white` (#FFFFFF)

        // ═══ STATUS — NOT brand. Never use red-*/green-*/etc. ═══
        success: { DEFAULT: '#6B8E5A', ink: '#3F5733', tint: '#E5ECDC' },
        warning: { DEFAULT: '#C68B3B', ink: '#7A5117', tint: '#F6E6C4' },
        error:   { DEFAULT: '#B14A36', ink: '#6E2A1C', tint: '#F2D6CE' },
        info:    { DEFAULT: '#4A88B0', ink: '#21516E', tint: '#D6E4EE' },

        // ═══ CHART SERIES — Recharts index 1..5 ═══
        // 3 full-strength brand colors + 2 flattened tints (sand/white are
        // too light to read as chart segments).
        chart: {
          '1': '#2B3FBE',  // island-blue
          '2': '#F5A623',  // sun-yellow
          '3': '#1A2480',  // island-dark
          '4': '#8B9BDD',  // island-blue tint
          '5': '#F9CA7B',  // sun-yellow tint
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin-slow 20s linear infinite',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
