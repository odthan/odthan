import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#E10D0D', dark: '#B00A0A', soft: '#FDECEC' },
        ink: { DEFAULT: '#0A0A0A', 2: '#171717', 3: '#262626' },
        mist: '#F4F4F5',
      },
      fontFamily: { sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
      keyframes: { pop: { '0%': { transform: 'scale(.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
                   slide: { '0%': { transform: 'translateY(-8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } } },
      animation: { pop: 'pop .18s ease-out', slide: 'slide .2s ease-out' },
    },
  },
  plugins: [],
} satisfies Config;
