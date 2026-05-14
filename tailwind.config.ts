import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-share-tech-mono)", "Courier New", "monospace"],
        mono: ["var(--font-share-tech-mono)", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
}

export default config
