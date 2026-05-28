const { venatorUIPreset } = require('@venator-ui/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  presets: [venatorUIPreset],
  content: [
    './client/**/*.{ts,tsx}',
    './client/index.html',
    './node_modules/@venator-ui/ui/dist/**/*.{js,mjs}',
    './node_modules/@venator-ui/patterns/dist/**/*.{js,mjs}',
  ],
  theme: { extend: {} },
  plugins: [],
};
