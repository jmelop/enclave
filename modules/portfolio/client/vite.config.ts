import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: [
      // Standalone-dev isolation: replace real EnclaveNav (which imports the
      // global module registry → all other modules → @/ alias collisions)
      // with a self-contained stub that only renders portfolio's nav.
      { find: '@enclave/ui-shell', replacement: path.resolve(__dirname, './stubs/EnclaveNav.stub.tsx') },

      { find: '@enclave/sdk',             replacement: path.resolve(__dirname, '../../../packages/sdk/src/index.ts') },
      { find: /^react$/,                  replacement: path.resolve(__dirname, '../node_modules/react') },
      { find: /^react-dom$/,              replacement: path.resolve(__dirname, '../node_modules/react-dom') },
      { find: /^react-router-dom$/,       replacement: path.resolve(__dirname, '../node_modules/react-router-dom') },
      { find: /^@venator-ui\/ui$/,        replacement: path.resolve(__dirname, '../node_modules/@venator-ui/ui') },
      { find: /^@venator-ui\/patterns$/,  replacement: path.resolve(__dirname, '../node_modules/@venator-ui/patterns') },
      { find: /^lucide-react$/,           replacement: path.resolve(__dirname, '../node_modules/lucide-react') },
      { find: '@',                        replacement: path.resolve(__dirname, '.') },
    ],
  },
})
