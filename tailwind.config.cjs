const { venatorPreset } = require('@venator-ui/tokens')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  presets: [venatorPreset],
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@venator-ui/ui/dist/**/*.{js,mjs}',
    './node_modules/@venator-ui/patterns/dist/**/*.{js,mjs}',
  ],
  theme: { extend: {} },
  plugins: [],
}
