import type { Config } from 'tailwindcss';
import tailwindAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium Japan Design System
        hinomaru: {
          DEFAULT: '#BC002D',
          light: '#E8334D',
          dark: '#8A001A',
          dim: 'rgba(188, 0, 45, 0.12)',
          glow: 'rgba(188, 0, 45, 0.4)',
        },
        gold: {
          DEFAULT: '#C9A962',
          light: '#D9C082',
          dark: '#A68B42',
          dim: 'rgba(201, 169, 98, 0.1)',
        },
        // Dark backgrounds
        qs: {
          bg: {
            primary: '#0A0A0C',
            secondary: '#111114',
            elevated: '#18181C',
            card: '#0E0E11',
          },
          // Status colors
          success: {
            DEFAULT: '#00C896',
            50: '#f0fdf4',
            500: '#00C896',
            700: '#00A87D',
          },
          warning: {
            DEFAULT: '#F0A030',
            50: '#fffbeb',
            500: '#F0A030',
            700: '#D08020',
          },
          danger: {
            DEFAULT: '#E84057',
            50: '#fef2f2',
            500: '#E84057',
            700: '#C82040',
          },
          // Text colors
          text: {
            primary: '#F8F8FA',
            secondary: '#9898A0',
            tertiary: '#606068',
          },
          // Border colors
          border: {
            subtle: 'rgba(255, 255, 255, 0.04)',
            default: 'rgba(255, 255, 255, 0.08)',
          },
        },
        // shadcn/ui compatible colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Noto Sans JP', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'Noto Sans JP', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'JetBrains Mono', 'monospace'],
        sans: ['Plus Jakarta Sans', 'Noto Sans JP', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'qs-md': '10px',
        'qs-lg': '14px',
        'qs-xl': '20px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        // Hinomaru animations
        'hinomaru-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 80px rgba(188, 0, 45, 0.4)',
          },
          '50%': {
            transform: 'scale(1.02)',
            boxShadow: '0 0 100px rgba(188, 0, 45, 0.4)',
          },
        },
        'orbit-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'logo-rotate': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'hinomaru-pulse': 'hinomaru-pulse 4s ease-in-out infinite',
        'orbit-spin': 'orbit-spin 15s linear infinite',
        'orbit-spin-reverse': 'orbit-spin 25s linear infinite reverse',
        'logo-rotate': 'logo-rotate 20s linear infinite',
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
