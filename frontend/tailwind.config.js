export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#CE6A6C',
          light: '#EDADA3',
          dark: '#BA5658',
        },
        secondary: {
          DEFAULT: '#42899B',
          dark: '#2E7587',
        },
        success: {
          DEFAULT: '#94C4C1',
          dark: '#80B0AD',
        },
        background: {
          DEFAULT: '#F9C7BE',
        },
        text: {
          DEFAULT: '#28405C',
          light: '#64748B',
          muted: '#94A3B8',
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}