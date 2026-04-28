/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        // Distinctive but professional. Fraunces for display = serif with character.
        // IBM Plex Sans for body = financial/technical feel without being generic.
        // Plex Mono for numbers/calculator inputs.
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Editorial finance palette: deep ink, warm cream, single accent
        ink: {
          DEFAULT: '#0A0A0A',
          900: '#0A0A0A',
          800: '#1A1A1A',
          700: '#2A2A2A',
          600: '#404040',
          500: '#6B6B6B',
          400: '#8A8A8A',
          300: '#B5B5B5',
          200: '#D4D4D4',
          100: '#EAEAEA',
        },
        cream: {
          DEFAULT: '#FAF7F2',
          50: '#FDFCFA',
          100: '#FAF7F2',
          200: '#F2EDE3',
          300: '#E8DFCD',
        },
        // Single accent: deep amber. Trustworthy, not generic finance-blue.
        accent: {
          DEFAULT: '#B45309',
          50: '#FEF3C7',
          100: '#FDE68A',
          500: '#B45309',
          600: '#92400E',
          700: '#78350F',
        },
        // Semantic
        positive: '#15803D',
        negative: '#B91C1C',
      },
      maxWidth: {
        prose: '68ch',
        content: '1200px',
        narrow: '720px',
      },
      fontSize: {
        // Larger, more editorial scale
        'display-1': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-2': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        'h2': ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
    },
  },
  plugins: [],
};
