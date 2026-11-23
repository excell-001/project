/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#F0F4F9',
          100: '#D9E4F2',
          200: '#B3C9E5',
          500: '#1E4E8C',
          700: '#133768',
          800: '#0E2C54',
          900: '#0B2545',
          950: '#07182E',
        },
        royal: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(11, 37, 69, 0.06), 0 1px 2px -1px rgba(11, 37, 69, 0.04)',
        elevated: '0 10px 25px -5px rgba(11, 37, 69, 0.08), 0 8px 10px -6px rgba(11, 37, 69, 0.04)',
      },
    },
  },
  plugins: [],
};