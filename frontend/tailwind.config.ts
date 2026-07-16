import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'], // supports both standard class and data-theme approach
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        bg2: 'hsl(var(--bg2) / <alpha-value>)',
        panel: 'hsl(var(--panel) / <alpha-value>)',
        panel2: 'hsl(var(--panel2) / <alpha-value>)',
        panel3: 'hsl(var(--panel3) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        'border-soft': 'hsl(var(--border-soft) / <alpha-value>)',
        text: 'hsl(var(--text) / <alpha-value>)',
        text2: 'hsl(var(--text2) / <alpha-value>)',
        text3: 'hsl(var(--text3) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-dim': 'hsl(var(--accent-dim) / <alpha-value>)',
        'accent-soft': 'hsl(var(--accent-soft) / <alpha-value>)',
        'accent-text': 'hsl(var(--accent-text) / <alpha-value>)',
        entity: {
          person: 'hsl(var(--e-person) / <alpha-value>)',
          tech: 'hsl(var(--e-tech) / <alpha-value>)',
          concept: 'hsl(var(--e-concept) / <alpha-value>)',
          product: 'hsl(var(--e-product) / <alpha-value>)',
          document: 'hsl(var(--e-document) / <alpha-value>)',
          org: 'hsl(var(--e-org) / <alpha-value>)',
          event: 'hsl(var(--e-event) / <alpha-value>)',
          location: 'hsl(var(--e-location) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Space Grotesk', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
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
        'fade-in': 'fadeIn 0.25s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'mic-pulse': 'micPulse 1.4s ease-out infinite',
        'viseme': 'viseme .4s ease-in-out infinite alternate',
        'dot-pulse': 'dotPulse 1.5s infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px hsl(var(--accent)), 0 0 10px hsl(var(--accent))' },
          '100%': { boxShadow: '0 0 10px hsl(var(--accent)), 0 0 20px hsl(var(--accent))' },
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
        micPulse: {
          '0%': { boxShadow: '0 0 0 0 hsl(var(--accent-soft))' },
          '70%': { boxShadow: '0 0 0 12px transparent' },
          '100%': { boxShadow: '0 0 0 0 transparent' },
        },
        viseme: {
          '0%': { transform: 'scaleY(0.2)' },
          '100%': { transform: 'scaleY(1)' },
        },
        dotPulse: {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0.5' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
