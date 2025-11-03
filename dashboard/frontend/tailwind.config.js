/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        tennis: {
          green: '#22d3a6',
          purple: '#7c3aed',
          midnight: '#0f172a'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif']
      }
    }
  },
  plugins: []
}
