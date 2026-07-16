import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'hsl(var(--bg-base))',
          surface: 'hsl(var(--bg-surface))',
          elevated: 'hsl(var(--bg-elevated))',
          sidebar: 'hsl(var(--bg-sidebar))',
          panel: 'hsl(var(--bg-panel))',
          avatar: 'hsl(var(--bg-avatar))',
        },
        accent: {
          primary: 'hsl(var(--accent-primary))',
          secondary: 'hsl(var(--accent-secondary))',
          cyan: 'hsl(var(--accent-cyan))',
        },
        text: {
          primary: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          muted: 'hsl(var(--text-muted))',
          quaternary: 'hsl(var(--text-quaternary))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          subtle: 'hsl(var(--border-subtle))',
          strong: 'hsl(var(--border-strong))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--error))',
        ring: 'hsl(var(--ring))',
        overlay: 'var(--overlay)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        /* Linear-inspired type scale */
        'display-xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.044em', fontWeight: '510' }],
        'display-lg': ['4rem', { lineHeight: '1', letterSpacing: '-0.044em', fontWeight: '510' }],
        'display': ['3rem', { lineHeight: '1', letterSpacing: '-0.044em', fontWeight: '510' }],
        'heading-1': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.044em', fontWeight: '510' }],
        'heading-2': ['1.5rem', { lineHeight: '1.33', letterSpacing: '-0.02em', fontWeight: '510' }],
        'heading-3': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.02em', fontWeight: '510' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-medium': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        'body-semibold': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
        'small': ['0.9375rem', { lineHeight: '1.6', letterSpacing: '-0.01em', fontWeight: '400' }],
        'small-medium': ['0.9375rem', { lineHeight: '1.6', letterSpacing: '-0.01em', fontWeight: '500' }],
        'caption-lg': ['0.875rem', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '500' }],
        'caption': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        'micro': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
        'scale-in': 'scaleIn 0.5s ease-out both',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px hsl(var(--accent-cyan)), 0 0 10px hsl(var(--accent-cyan))' },
          '100%': { boxShadow: '0 0 10px hsl(var(--accent-cyan)), 0 0 20px hsl(var(--accent-cyan))' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.04)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'elevated': '0 4px 24px -4px rgba(0, 0, 0, 0.1)',
        'elevated-dark': '0 4px 24px -4px rgba(0, 0, 0, 0.4)',
        'glow-primary': '0 0 20px hsl(var(--accent-primary) / 0.15), 0 0 60px hsl(var(--accent-primary) / 0.05)',
        'glow-cyan': '0 0 20px hsl(var(--accent-cyan) / 0.2), 0 0 60px hsl(var(--accent-cyan) / 0.08)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
