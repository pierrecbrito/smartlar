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
          50: '#eef8ff',
          100: '#d8eeff',
          200: '#b9e0ff',
          300: '#8acaff',
          400: '#53a8ff',
          500: '#2b84ff',
          600: '#1565f5',
          700: '#0e4fdc',
          800: '#1141b2',
          900: '#13398c',
          950: '#0b2154',
        }
      }
    },
  },
  plugins: [],
}
