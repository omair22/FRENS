/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#111111',
        'surface-2': '#1a1a1a',
        accent: '#ff4d4d',
        green: '#4caf7d',
        'text-primary': '#f5f5f5',
        'text-secondary': '#666666',
        'text-tertiary': '#3a3a3a',
        // Legacy aliases (kept for compatibility)
        card: '#111111',
        primary: {
          red: '#ff4d4d',
          yellow: '#f5a623',
          green: '#4caf7d',
          blue: '#4d96ff',
          purple: '#9b7fff',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'DEFAULT': '12px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}
