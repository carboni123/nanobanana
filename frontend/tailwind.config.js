/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        banana: {
          50: '#fffef0',
          100: '#fffacc',
          200: '#fff699',
          300: '#ffed66',
          400: '#ffe333',
          500: '#ffd700', // primary banana yellow
          600: '#ccac00',
          700: '#998100',
          800: '#665600',
          900: '#332b00',
        },
      },
    },
  },
  plugins: [],
}
