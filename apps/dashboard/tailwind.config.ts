import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        app: '#f7f7fb',   // fond premium très léger
        ink: '#18181b',   // texte quasi-noir
        // Palette de marque — violet #5701f3 (style SiteDrop)
        brand: {
          50:  '#f0ebfe',
          100: '#ddd0fd',
          200: '#c4adfb',
          300: '#a784f9',
          400: '#8a4ff7',
          500: '#5701f3',
          600: '#4801cc',
          700: '#3a01a1',
        },
        // On aligne `indigo` (utilisé partout dans les composants) sur le violet de marque
        // → toute l'app adopte le look SiteDrop sans éditer chaque fichier.
        indigo: {
          50:  '#f0ebfe',
          100: '#ddd0fd',
          200: '#c4adfb',
          300: '#a784f9',
          400: '#8a4ff7',
          500: '#5701f3',
          600: '#4801cc',
          700: '#3a01a1',
          800: '#2d0079',
          900: '#1f0054',
          950: '#14003a',
        },
      },
    },
  },
  plugins: [forms],
};

export default config;
