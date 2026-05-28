import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ═══ BRAND — 5 colors. These are La Isla. ═══
        lagoon:     '#7CC1E7',  // Cielo    · cool accent
        maize:      '#F2D17E',  // Arena    · warm highlight
        olive:      '#ACAD79',  // Palma    · muted accent
        espresso:   '#43593B',  // Selva    · deep surface / nav
        terracotta: '#E87A5D',  // Coral    · primary CTA

        // ═══ NEUTRALS — utility, NOT brand ═══
        cream:  '#FFF9EC',  // app background (alias: paper)
        paper:  '#FFF9EC',  // same as cream — design-file canonical name
        ink:    '#1F2A1B',  // body text  · AAA on paper
        stone:  '#6B7768',  // helper text · AA on paper (alias: muted)
        muted:  '#6B7768',  // same as stone — design-file canonical name
        rule: {
          DEFAULT: '#E7DEC6',
          strong:  '#C9BC9B',
        },

        // ═══ STATUS — NOT brand. Never use red-*/green-*/etc. ═══
        success: { DEFAULT: '#6B8E5A', ink: '#3F5733', tint: '#E5ECDC' },
        warning: { DEFAULT: '#C68B3B', ink: '#7A5117', tint: '#F6E6C4' },
        error:   { DEFAULT: '#B14A36', ink: '#6E2A1C', tint: '#F2D6CE' },
        info:    { DEFAULT: '#4A88B0', ink: '#21516E', tint: '#D6E4EE' },

        // ═══ SEMANTIC ALIASES — same hexes, addressed by role ═══
        surface: {
          base: '#FFF9EC',
          tint: '#FBF3DE',
          deep: '#43593B',
          warm: '#F2D17E',
        },
        accent: {
          primary: '#E87A5D',
          cool:    '#7CC1E7',
          muted:   '#ACAD79',
          warm:    '#F2D17E',
        },
        foreground: {
          DEFAULT: '#1F2A1B',
          muted:   '#6B7768',
          onDeep:  '#FFF9EC',
        },

        // ═══ CHART SERIES — Recharts index 1..5 ═══
        chart: {
          '1': '#E87A5D',  // coral  — lead metric
          '2': '#43593B',  // selva
          '3': '#ACAD79',  // palma
          '4': '#7CC1E7',  // cielo
          '5': '#F2D17E',  // arena
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
