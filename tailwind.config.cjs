const { venatorUIPreset } = require('@venator-ui/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  presets: [venatorUIPreset],
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@venator-ui/ui/dist/**/*.{js,mjs}',
    './node_modules/@venator-ui/patterns/dist/**/*.{js,mjs}',
  ],
  theme: { extend: {} },
  plugins: [],
};
