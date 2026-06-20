/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          950: '#030008', // Ultra dark background
          900: '#0a0518', // Deep luxury violet-black
          800: '#140c2d', // Deep violet drawer/cards
          700: '#231548', // Card focus
          DEFAULT: '#0a0518',
        },
        brand: {
          primary: '#8b5cf6',   // Neon violet
          secondary: '#ec4899', // Hot pink
          accent: '#eab308',    // Luxury amber
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'Outfit', 'system-ui', 'sans-serif'],
        milker: ['var(--font-milker)', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-neon': '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
      }
    },
  },
  plugins: [],
}
