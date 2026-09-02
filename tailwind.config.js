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
          DEFAULT: '#080E0B',
          dark: '#050907',
          light: '#0D1912',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          raised: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.12)',
          dark: '#0D1612',
          card: 'rgba(13, 25, 18, 0.75)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.12)',
          subtle: 'rgba(255, 255, 255, 0.06)',
          active: '#10B981',
        },
        brand: {
          DEFAULT: '#10B981',
          green: '#10B981',
          lightGreen: '#34D399',
          darkGreen: '#059669',
          mint: '#6EE7B7',
          glow: 'rgba(16, 185, 129, 0.25)',
        },
        gain: {
          DEFAULT: '#10B981',
          glow: 'rgba(16, 185, 129, 0.2)',
          dark: '#059669',
        },
        danger: {
          DEFAULT: '#F87171',
          glow: 'rgba(248, 113, 113, 0.2)',
          dark: '#EF4444',
        },
        warning: {
          DEFAULT: '#FBBF24',
          glow: 'rgba(251, 191, 36, 0.2)',
        },
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          tertiary: '#6B7280',
          dark: '#064E3B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '24px',
        'btn': '999px',
        'pill': '999px',
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glow-green': '0 0 25px -3px rgba(16, 185, 129, 0.4)',
        'glow-mint': '0 0 25px -3px rgba(52, 211, 153, 0.4)',
        'glow-danger': '0 0 25px -3px rgba(248, 113, 113, 0.35)',
      },
      backgroundImage: {
        'gradient-green': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-mint': 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
        'gradient-hero': 'linear-gradient(135deg, #A7F3D0 0%, #D1FAE5 40%, #FFFFFF 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0D1912 0%, #080E0B 100%)',
        'gradient-bg': 'radial-gradient(ellipse at top, #0F2318 0%, #080E0B 100%)',
      }
    },
  },
  plugins: [],
}
