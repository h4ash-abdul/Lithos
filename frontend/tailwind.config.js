/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        circe: {
          base: '#000000',
          panel: '#080808',
          panelHover: '#0f0f0f',
          border: '#1a1a1a',
          borderActive: '#262626',
          textMain: '#e8e6df',
          textMuted: '#7a8090',
          textDark: '#3a3f4a',
          gold: '#b6a172',
          goldDim: 'rgba(182, 161, 114, 0.12)',
          coral: '#b5555f',
          coralDim: 'rgba(181, 85, 95, 0.12)',
          amber: '#c17a35',
          amberDim: 'rgba(193, 122, 53, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '3px',
        md: '4px',
        lg: '4px',
      }
    },
  },
  plugins: [],
}