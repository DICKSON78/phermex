/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0FD452',
          50: '#e8fdf0',
          100: '#c5f9d8',
          200: '#93f2b5',
          300: '#56e58a',
          400: '#22d464',
          500: '#0FD452',
          600: '#05b843',
          700: '#049037',
          800: '#08722e',
          900: '#075d27',
        },
        dark: {
          DEFAULT: '#000F14',
          50: '#e6f2f5',
          100: '#b3d9e0',
          200: '#80bfc9',
          300: '#4da5b2',
          400: '#2691a1',
          500: '#0d7d90',
          600: '#0a6673',
          700: '#074e56',
          800: '#04373a',
          900: '#000F14',
        },
        surface: '#F5F7F5',
        'primary-dark': '#05b843',
        'primary-light': '#e8fdf0',
        forest: {
          DEFAULT: '#0a2e1a',
          dark: '#0d3d22',
          darker: '#071f12',
        },
        gold: '#D4A853',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
