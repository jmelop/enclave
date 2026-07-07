const { venatorUIPreset } = require('@venator-ui/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  presets: [venatorUIPreset],
  content: [
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './index.html',
    './node_modules/@venator-ui/ui/dist/**/*.{js,mjs}',
    './node_modules/@venator-ui/patterns/dist/**/*.{js,mjs}',
    '../../modules/*/client/**/*.{ts,tsx}',
    '../../modules/*/module/**/*.{ts,tsx}',
    '../../packages/ui-shell/src/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
