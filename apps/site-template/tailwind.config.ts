import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // CSS custom properties injectées dans layout.tsx depuis branding config
        primary:   'var(--color-primary)',
        secondary: 'var(--color-secondary)',
      },
      fontFamily: {
        sans:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
