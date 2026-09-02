/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#090E0C',
          dark: '#050807',
          surface: '#0E1612',
          light: '#131F1A',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          raised: 'rgba(255, 255, 255, 0.07)',
          hover: 'rgba(255, 255, 255, 0.10)',
          active: 'rgba(16, 185, 129, 0.12)',
          dark: '#0C1310',
          card: '#0F1814',
          cardBorder: 'rgba(255, 255, 255, 0.08)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          subtle: 'rgba(255, 255, 255, 0.05)',
          strong: 'rgba(255, 255, 255, 0.14)',
          active: '#10B981',
          hover: 'rgba(16, 185, 129, 0.35)',
        },
        brand: {
          DEFAULT: '#10B981',
          green: '#10B981',
          lightGreen: '#34D399',
          darkGreen: '#059669',
          mint: '#6EE7B7',
          glow: 'rgba(16, 185, 129, 0.18)',
        },
        gain: {
          DEFAULT: '#10B981',
          glow: 'rgba(16, 185, 129, 0.15)',
          dark: '#059669',
        },
        danger: {
          DEFAULT: '#F87171',
          glow: 'rgba(248, 113, 113, 0.15)',
          dark: '#EF4444',
        },
        warning: {
          DEFAULT: '#FBBF24',
          glow: 'rgba(251, 191, 36, 0.15)',
        },
        text: {
          primary: '#F9FAFB',
          secondary: '#94A3B8',
          tertiary: '#64748B',
          muted: '#475569',
          accent: '#34D399',
          dark: '#064E3B',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'card': '20px',
        'card-sm': '14px',
        'btn': '10px',
        'pill': '999px',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'card-elevated': '0 12px 32px -4px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(16, 185, 129, 0.3), 0 0 20px -4px rgba(16, 185, 129, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glow-green': '0 0 24px -4px rgba(16, 185, 129, 0.35)',
        'glow-mint': '0 0 24px -4px rgba(52, 211, 153, 0.35)',
        'modal': '0 24px 64px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-green': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-mint': 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
        'gradient-card-dark': 'linear-gradient(180deg, rgba(20, 32, 26, 0.65) 0%, rgba(12, 19, 16, 0.85) 100%)',
        'gradient-surface': 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'gradient-highlight': 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
      }
    },
  },
  plugins: [],
}
