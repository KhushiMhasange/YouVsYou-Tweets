/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        spark: {
          '0%': { opacity: 1, transform: 'scale(0.5)' },
          '100%': { opacity: 0, transform: 'scale(2)' },
        },
      },
      animation: {
        spark: 'spark 300ms ease-out',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['Fira Code', 'monospace'],
        fancy: ['"Playfair Display"', 'serif'], 
      },
    },
  },
  plugins: [],
}
