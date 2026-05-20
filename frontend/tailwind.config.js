/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        park: {
          red:     '#e63946',
          orange:  '#f4a261',
          yellow:  '#e9c46a',
          teal:    '#2a9d8f',
          blue:    '#457b9d',
          purple:  '#6a4c93',
          night:   '#0d0f14',
          dark:    '#13161e',
          card:    '#1a1d28',
          border:  '#2a2d3a',
          muted:   '#6b7280',
        },
      },
      backgroundImage: {
        'rainbow': 'linear-gradient(90deg, #e63946, #f4a261, #e9c46a, #2a9d8f, #457b9d, #6a4c93)',
        'rainbow-soft': 'linear-gradient(135deg, rgba(230,57,70,0.15), rgba(244,162,97,0.15), rgba(233,196,106,0.1), rgba(42,157,143,0.15), rgba(69,123,157,0.15), rgba(106,76,147,0.15))',
        'card-glass': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        'hero-overlay': 'linear-gradient(to bottom, rgba(13,15,20,0.3) 0%, rgba(13,15,20,0.5) 50%, rgba(13,15,20,0.95) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow-red':    '0 0 20px rgba(230,57,70,0.3)',
        'glow-teal':   '0 0 20px rgba(42,157,143,0.3)',
        'glow-purple': '0 0 20px rgba(106,76,147,0.3)',
        'glow-orange': '0 0 20px rgba(244,162,97,0.3)',
        'nav': '0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'fade-up':     'fadeUp 0.6s ease forwards',
        'fade-in':     'fadeIn 0.4s ease forwards',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'rainbow-flow':'rainbowFlow 4s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        rainbowFlow: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

