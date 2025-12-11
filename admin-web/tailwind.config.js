/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#2c2c2c',
        'gold': '#DAA520',
        'gold-light': 'rgba(218, 165, 32, 0.2)',
      },
    },
  },
  plugins: [],
}








