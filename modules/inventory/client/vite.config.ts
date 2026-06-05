import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: [
      // ── Standalone-dev isolation ──────────────────────────────────────────
      // Replace the real @enclave/ui-shell with an inventory-only stub.
      // The real EnclaveNav statically imports enclave.modules.client (the root
      // module registry), which in turn imports every other module's source.
      // Those files use `@/` to reference their own roots, but in this dev
      // server `@` is aliased to inventory's client dir → import failures.
      { find: '@enclave/ui-shell', replacement: path.resolve(__dirname, './stubs/EnclaveNav.stub.tsx') },

      // ── @enclave/sdk (types only, used by AppShell and module config) ─────
      { find: '@enclave/sdk',      replacement: path.resolve(__dirname, '../../../packages/sdk/src/index.ts') },

      // ── Shared package deduplication ──────────────────────────────────────
      { find: /^react$/,            replacement: path.resolve(__dirname, '../node_modules/react') },
      { find: /^react-dom$/,        replacement: path.resolve(__dirname, '../node_modules/react-dom') },
      { find: /^react-router-dom$/, replacement: path.resolve(__dirname, '../node_modules/react-router-dom') },
      { find: /^@venator-ui\/ui$/,  replacement: path.resolve(__dirname, '../node_modules/@venator-ui/ui') },
      { find: /^lucide-react$/,     replacement: path.resolve(__dirname, '../node_modules/lucide-react') },

      // ── Local source alias ────────────────────────────────────────────────
      { find: '@',                  replacement: path.resolve(__dirname, '.') },
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
})
