/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NFL Team Colors - Patriots as primary
        patriots: {
          primary: '#002244',   // Navy Blue
          secondary: '#C60C30', // Red
          accent: '#B0B7BC',    // Silver
        },
      },
      fontFamily: {
        score: ['Arial Black', 'Arial', 'sans-serif'],
      },
      animation: {
        'pulse-score': 'pulse-score 0.5s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'draw-check': 'draw-check 0.3s ease-out forwards',
      },
      keyframes: {
        'pulse-score': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'draw-check': {
          '0%': { strokeDasharray: '0, 100' },
          '100%': { strokeDasharray: '100, 0' },
        },
      },
    },
  },
  plugins: [],
};
