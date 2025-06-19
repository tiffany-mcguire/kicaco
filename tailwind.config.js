/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-out': 'fadeOut 1.5s ease-out forwards',
      },
      keyframes: {
        fadeOut: {
          '0%': { 
            backgroundColor: 'rgba(33, 126, 143, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.5rem'
          },
          '100%': { 
            backgroundColor: 'transparent',
            boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)',
            borderRadius: '0'
          },
        },
      },
    },
  },
  plugins: [],
} 