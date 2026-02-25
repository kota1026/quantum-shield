/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Quantum Shield brand colors
        'qs-primary': '#6366f1',
        'qs-secondary': '#8b5cf6',
        'qs-success': '#10b981',
        'qs-warning': '#f59e0b',
        'qs-danger': '#ef4444',
        'qs-info': '#3b82f6',
      },
    },
  },
  plugins: [],
};