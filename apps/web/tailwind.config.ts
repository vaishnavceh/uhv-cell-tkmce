/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        institutional: {
          950: '#021e17', // ultra deep pine
          900: '#062e22', // deep forest green
          850: '#064e3b', // primary rich emerald / institutional green
          800: '#065f46', // dark emerald
          700: '#047857', // forest emerald
          600: '#059669', // classic emerald
          500: '#10b981', // vibrant green
          400: '#34d399', // bright mint
          200: '#a7f3d0', // pale mint
          100: '#d1fae5', // soft mint background
          50: '#ecfdf5',  // ice emerald
          warm: '#f6f9f7', // clean botanical off-white
        },
        uhv: {
          greenDark: '#064e3b',
          greenPrimary: '#047857',
          greenLight: '#10b981',
          greenBg: '#f0fdf4',
          gold: '#d97706',
          goldLight: '#fde68a',
          goldDark: '#b45309',
          slate: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(6, 78, 59, 0.05), 0 1px 2px rgba(6, 78, 59, 0.03)',
        card: '0 4px 6px -1px rgba(6, 78, 59, 0.06), 0 2px 4px -2px rgba(6, 78, 59, 0.04)',
        elevation: '0 10px 15px -3px rgba(6, 78, 59, 0.08), 0 4px 6px -4px rgba(6, 78, 59, 0.04)',
        greenGlow: '0 0 25px -5px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [],
}
