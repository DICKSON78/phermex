/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0FD452',
          dark: '#0BB543',
          light: '#2EE86A',
        },
        dark: {
          DEFAULT: '#000F14',
          lighter: '#0A1A22',
          card: '#0D1E26',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        heading: ['Lulo Clean', 'Poppins', 'sans-serif'],
        body: ['Avenir', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
