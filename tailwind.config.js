/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Lora', '"Cormorant Garamond"', 'Georgia', 'serif'],
        handwriting: ['Caveat', 'cursive'],
      },
      colors: {
        paper: {
          50: '#fdfbf7',   // Cream paper
          100: '#faf8f5',  // Warm off-white
          200: '#f5f0e8',  // Soft beige
          300: '#ece4d8',  // Aged paper border
          800: '#27272a',  // Warm dark gray
          900: '#18181b',  // Soft black
          950: '#121214',  // Deep charcoal
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        amberbrand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      borderRadius: {
        'card': '16px',
        'modal': '20px'
      }
    },
  },
  plugins: [],
}
