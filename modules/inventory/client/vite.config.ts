import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@enclave/sdk': path.resolve(__dirname, '../../../packages/sdk/src/index.ts'),
      '@': path.resolve(__dirname, '.'),
    },
  },
})
