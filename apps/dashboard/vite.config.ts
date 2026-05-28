import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const invClient = path.resolve(__dirname, '../../modules/inventory/client').replace(/\\/g, '/')

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: [
      // Inventory module's @/ prefixes — must come before the catch-all '@'
      { find: /^@\/components\/inventory\/(.+)/, replacement: `${invClient}/components/inventory/$1` },
      { find: /^@\/components\/ui\/(.+)/,        replacement: `${invClient}/components/ui/$1` },
      { find: /^@\/store\/(.+)/,                 replacement: `${invClient}/store/$1` },
      { find: /^@\/types\/(.+)/,                 replacement: `${invClient}/types/$1` },
      { find: '@/lib/utils',                     replacement: `${invClient}/lib/utils.ts` },
      { find: '@/lib/seed',                      replacement: `${invClient}/lib/seed.ts` },
      // Shared
      { find: '@enclave/sdk',      replacement: path.resolve(__dirname, '../../packages/sdk/src/index.ts') },
      { find: '@enclave/ui-shell', replacement: path.resolve(__dirname, '../../packages/ui-shell/src/index.ts') },
      // Pin ui-shell peer deps to dashboard node_modules (ui-shell has no own node_modules)
      { find: /^@venator-ui\/ui$/, replacement: path.resolve(__dirname, 'node_modules/@venator-ui/ui') },
      { find: /^lucide-react$/,    replacement: path.resolve(__dirname, 'node_modules/lucide-react') },
      // Dashboard catch-all (portal, app-card, etc.)
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
})
