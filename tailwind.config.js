/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdfbf7',
          100: '#f7f2e7',
          200: '#eee3cb',
          300: '#e1cea7',
          400: '#d0b37d',
          500: '#b99557',
          800: '#543d22',
          900: '#382614',
          950: '#22160a',
        },
        vault: {
          dark: '#0e1117',
          card: '#161b22',
          border: '#30363d',
          gold: '#d4af37',
          amber: '#f59e0b',
          tragic: '#8b263e',
          sepia: '#704214'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        cinzel: ['"Cinzel"', 'serif'],
        typewriter: ['"Special Elite"', '"Courier New"', 'monospace'],
        handwriting: ['"IM Fell English"', 'Georgia', 'serif']
      }
    },
  },
  plugins: [],
}
