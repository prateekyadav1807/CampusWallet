/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#0B1220', surface: '#111827', card: '#151F32', elevated: '#1a2540' },
        border:  { DEFAULT: 'rgba(255,255,255,0.06)', strong: 'rgba(255,255,255,0.10)', focus: '#14B8A6' },
        accent: {
          DEFAULT: '#14B8A6',
          hover:   '#0D9488',
          muted:   'rgba(20,184,166,0.12)',
          border:  'rgba(20,184,166,0.25)',
        },
        success: { DEFAULT: '#22C55E', muted: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)'  },
        danger:  { DEFAULT: '#EF4444', muted: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)'  },
        warning: { DEFAULT: '#F59E0B', muted: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
        info:    { DEFAULT: '#3B82F6', muted: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
        ink: {
          DEFAULT:   '#F1F5F9',
          secondary: '#94A3B8',
          muted:     '#475569',
          faint:     '#2D3F55',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card:        '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
        modal:       '0 8px 48px rgba(0,0,0,0.6)',
        glow:        '0 0 20px rgba(20,184,166,0.20)',
        'glow-sm':   '0 0 10px rgba(20,184,166,0.15)',
        dropdown:    '0 8px 32px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm:   '0.375rem',
        md:   '0.5rem',
        lg:   '0.75rem',
        xl:   '1rem',
        '2xl':'1.25rem',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-up':  'slideUp 0.3s ease-out',
        'shimmer':   'shimmer 1.6s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' },           '100%': { opacity: '1' } },
        slideUp:  { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
