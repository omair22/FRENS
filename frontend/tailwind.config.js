/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0e0c14',
        card: '#16131f',
        primary: {
          red: '#ff6b6b',
          yellow: '#ffd93d',
          green: '#6bcb77',
          blue: '#4d96ff',
          purple: '#c77dff',
        }
      },
      fontFamily: {
        display: ['Gabarito', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
