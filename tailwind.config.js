/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6EBF4',
          100: '#C1CEE3',
          200: '#9AAED1',
          300: '#728EBF',
          400: '#4F74AE',
          500: '#305DA0', // Main primary color
          600: '#0A2463', // Darker
          700: '#071D52',
          800: '#051541',
          900: '#030D31',
        },
        accent: {
          50: '#FFF6E5',
          100: '#FFE8BF',
          200: '#FFD999',
          300: '#FFC973',
          400: '#FFBC4D',
          500: '#FFAD26',
          600: '#FF8E00', // Main accent color
          700: '#D67900',
          800: '#AD6400',
          900: '#844D00',
        },
        success: {
          500: '#4CAF50',
        },
        warning: {
          500: '#FFC107',
        },
        error: {
          500: '#F44336',
        },
      },
      fontFamily: {
        sans: ['Source Sans Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
};