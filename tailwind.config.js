/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          warmWhite: '#F8F4EC',
          cream: '#F1E7D7',
          charcoal: '#111111',
          black: '#111111',
          crimson: '#B51F35',
          crimsonHover: '#981729',
          crimsonLight: '#FBE9EC',
          crimsonMuted: 'rgba(181, 31, 53, 0.15)',
          // Brand primary accent aliased to deep crimson
          orange: '#B51F35',
          orangeHover: '#981729',
          orangeLight: '#FBE9EC',
          mutedGrey: '#8B8985',
          border: '#E2DCD2',
          surface: '#FFFFFF',
          darkSurface: '#1A1A1A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
        'premium': '0 12px 36px -8px rgba(17, 17, 17, 0.08), 0 4px 16px -4px rgba(17, 17, 17, 0.04)',
        'card': '0 20px 40px -15px rgba(0,0,0,0.12), 0 0 1px 1px rgba(0,0,0,0.05)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
