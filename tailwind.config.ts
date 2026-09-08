import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ═══ BRAND — La Isla · Café Picnic ═══
        // Two-ink playero identity: cobalt blue + mango on cream.
        'island-blue': '#2043A9',  // Azul La Isla · dominant ink · headings, icons, CTA
        'sun-yellow':  '#FCA613',  // Mango La Isla · single accent · CTA fill, underlines
        'island-dark': '#101A3A',  // Tinta · long-form body text (near-black blue, not gray)
        sand:          '#FBF6E2',  // Crema · default page background, never pure white
        'sand-light':  '#FEF9E7',  // Crema clara · alternate section background
        // white — use Tailwind's built-in `white` (#FFFFFF), only for knockouts on blue

        // ═══ STATUS — NOT brand. Never use red-*/green-*/etc. ═══
        success: { DEFAULT: '#6B8E5A', ink: '#3F5733', tint: '#E5ECDC' },
        warning: { DEFAULT: '#C68B3B', ink: '#7A5117', tint: '#F6E6C4' },
        error:   { DEFAULT: '#B14A36', ink: '#6E2A1C', tint: '#F2D6CE' },
        info:    { DEFAULT: '#4A88B0', ink: '#21516E', tint: '#D6E4EE' },

        // ═══ CHART SERIES — Recharts index 1..5 ═══
        // 3 full-strength brand colors + 2 flattened tints (sand/white are
        // too light to read as chart segments).
        chart: {
          '1': '#2043A9',  // island-blue
          '2': '#FCA613',  // sun-yellow
          '3': '#101A3A',  // island-dark
          '4': '#8498D0',  // island-blue tint
          '5': '#FDCE7D',  // sun-yellow tint
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        // Additive: hand-lettered display face for the Homepage only —
        // does not touch `display`/`body` so Admin stays on DM Sans.
        script:  ['"Caprasimo"', 'cursive'],
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
