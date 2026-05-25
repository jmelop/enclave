import { venatorUIPreset } from '@venator-ui/tokens'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  presets: [venatorUIPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './node_modules/@venator-ui/ui/dist/**/*.{js,mjs}',
    './node_modules/@venator-ui/patterns/dist/**/*.{js,mjs}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
