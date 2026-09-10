/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        lime: {
          50: '#f7faea',
          100: '#edf7d2',
          200: '#dbefa7',
          300: '#c2e374',
          400: '#a3d443',
          500: '#84b81b', // Primary Brand Guideline Green
          600: '#729e18',
          700: '#567715',
          800: '#465f16',
          900: '#3c5116',
        },
        brand: {
          primary: '#84b81b',
          primaryDark: '#729e18',
          primaryLight: '#edf7d2',
          dark: '#0e1017',
          charcoal: '#161922',
          muted: '#5e6b7c',
          bg: '#f6f8fa',
          border: '#e8ecf2',
          card: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};
