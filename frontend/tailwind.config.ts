// Tailwind configuration with custom design tokens
import type { Config } from 'tailwindcss';

export default <Config>{
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(210, 60%, 55%)',
        secondary: 'hsl(340, 45%, 60%)',
        accent: 'hsl(45, 80%, 55%)',
        muted: 'hsl(210, 15%, 20%)',
        background: 'hsl(210, 10%, 98%)',
        foreground: 'hsl(210, 10%, 10%)',
      },
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
      },
      fontSize: {
        h1: ['2.25rem', { lineHeight: '2.5rem' }],
        h2: ['1.875rem', { lineHeight: '2.25rem' }],
        h3: ['1.5rem', { lineHeight: '2rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
      },
      container: {
        center: true,
        padding: '1rem',
        screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
      },
    },
  },
  plugins: [],
};
