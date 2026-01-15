import type { Config } from 'tailwindcss';

/**
 * Quantum Shield Phase 6 - Tailwind Configuration
 * Premium Japan Design System
 */
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium Japan Design System
        hinomaru: {
          DEFAULT: '#BC002D',
          50: '#FFE5EA',
          100: '#FFCCD5',
          200: '#FF99AB',
          300: '#FF6682',
          400: '#FF3358',
          500: '#BC002D',
          600: '#990025',
          700: '#77001D',
          800: '#550015',
          900: '#33000D',
        },
        gold: {
          DEFAULT: '#C9A962',
          50: '#FCF8EF',
          100: '#F9F1DF',
          200: '#F3E3BF',
          300: '#EDD59F',
          400: '#E7C77F',
          500: '#C9A962',
          600: '#A8894E',
          700: '#87693A',
          800: '#664926',
          900: '#452912',
        },
        // Background colors (matching mock design)
        background: {
          DEFAULT: '#0A0A0C',
          secondary: '#111114',
          tertiary: '#18181C',
          elevated: '#1E1E22',
          card: '#0E0E11',
        },
        // Surface colors
        surface: {
          DEFAULT: '#18181C',
          secondary: '#1E1E22',
          tertiary: '#2A2A2E',
        },
        // Text colors (matching mock design)
        foreground: {
          DEFAULT: '#F8F8FA',
          secondary: '#9898A0',
          tertiary: '#606068',
          muted: '#52525B',
        },
        // Semantic colors (matching mock design)
        success: {
          DEFAULT: '#00C896',
          foreground: '#F8F8FA',
        },
        warning: {
          DEFAULT: '#F0A030',
          foreground: '#0A0A0C',
        },
        danger: {
          DEFAULT: '#E84057',
          foreground: '#F8F8FA',
        },
        info: {
          DEFAULT: '#3B82F6',
          foreground: '#FAFAFA',
        },
        // Status colors (specific to Quantum Shield)
        status: {
          locked: '#C9A962',      // Gold - active lock
          unlocking: '#F0A030',  // Warning - in progress (matching mock)
          unlocked: '#00C896',   // Success - complete (matching mock)
          challenged: '#E84057', // Danger - under challenge (matching mock)
          emergency: '#BC002D',  // Hinomaru - emergency
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Noto Sans JP',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          'DM Mono',
          'monospace',
        ],
      },
      fontSize: {
        // Japanese-optimized sizes
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.75', letterSpacing: '0.025em' }],
        'lg': ['1.125rem', { lineHeight: '1.75', letterSpacing: '0.025em' }],
        'xl': ['1.25rem', { lineHeight: '1.75', letterSpacing: '0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '1.3', letterSpacing: '0.015em' }],
        '5xl': ['3rem', { lineHeight: '1.2', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        'qs': '0.625rem', // 10px - Quantum Shield standard
        'qs-lg': '0.875rem', // 14px
        'qs-xl': '1.25rem', // 20px
      },
      boxShadow: {
        'qs': '0 4px 24px rgba(188, 0, 45, 0.15)',
        'qs-gold': '0 4px 24px rgba(201, 169, 98, 0.15)',
        'qs-hover': '0 8px 32px rgba(188, 0, 45, 0.25)',
        'glow-hinomaru': '0 0 20px rgba(188, 0, 45, 0.4)',
        'glow-gold': '0 0 20px rgba(201, 169, 98, 0.4)',
      },
      backgroundImage: {
        'gradient-hinomaru': 'linear-gradient(135deg, #BC002D 0%, #990025 100%)',
        'gradient-gold': 'linear-gradient(135deg, #C9A962 0%, #A8894E 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0A0C 0%, #121214 100%)',
        'gradient-radial-hinomaru': 'radial-gradient(circle at center, rgba(188, 0, 45, 0.15) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(188, 0, 45, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(188, 0, 45, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};

export default config;
