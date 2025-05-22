/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8f5e8',
        surface: '#ffffff',
        'surface-hover': '#f0e9d6',
        primary: '#2c2c2c',
        secondary: '#666666',
        accent: '#ff6b35',
        border: '#d6d0c2',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Helvetica Neue',
          'Noto Sans SC',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
