/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Baskerville', 'serif'],
        vintage: ['"Playfair Display"', 'Georgia', 'serif'],
        handwritten: ['"Caveat"', '"Dancing Script"', 'cursive', 'Georgia']
      },
      colors: {
        parchment: {
          50: '#faf7f0',
          100: '#f4efe0',
          200: '#e8ddc4',
          300: '#dac7a3',
          400: '#c5ab7d',
          500: '#b1915e',
          600: '#9b7a4b',
          700: '#7d5f3c',
          800: '#644c33',
          900: '#4e3b2b',
        },
        vault: {
          950: '#07090e',
          900: '#0d1117',
          850: '#121720',
          800: '#161c28',
          700: '#232d3f',
          accent: '#d4af37'
        }
      }
    },
  },
  plugins: [],
}
