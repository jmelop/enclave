import { venatorUIPreset } from '@venator-ui/tokens'

export default {
  darkMode: 'class',
  presets: [venatorUIPreset],
  content: [
    './client/**/*.{ts,tsx}',
    './client/index.html',
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
