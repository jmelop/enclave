import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const root      = path.resolve(__dirname, '../..')
const invClient = path.resolve(root, 'modules/inventory/client').replace(/\\/g, '/')
const bdgClient = path.resolve(root, 'modules/budget/client').replace(/\\/g, '/')
const labClient = path.resolve(root, 'modules/lab/client').replace(/\\/g, '/')

/**
 * Rewrites ALL `@/` imports from module files so that each module's source
 * resolves against its own client directory, not the dashboard root.
 *
 * Static Vite aliases are global (no per-importer context), so a single `@`
 * catch-all can't distinguish between budget's `@/lib/utils` and lab's.
 * The `transform` hook fires before `vite:import-analysis` and rewrites
 * specifiers in-source so import-analysis sees absolute paths.
 */
function rewriteModuleAtImports(): Plugin {
  const n = (p: string) => p.replace(/\\/g, '/').toLowerCase()

  const MODULES = [
    { dir: n(path.resolve(root, 'modules/inventory/client')), client: invClient },
    { dir: n(path.resolve(root, 'modules/budget/client')),    client: bdgClient },
    { dir: n(path.resolve(root, 'modules/lab/client')),       client: labClient },
  ]

  return {
    name: 'rewrite-module-at-imports',
    enforce: 'pre',
    transform(code, id) {
      if (!code.includes('@/')) return
      const idNorm = n(id)
      const mod = MODULES.find(m => idNorm.startsWith(m.dir + '/'))
      if (!mod) return
      const result = code.replace(
        /from\s*(["'])(@\/[^"']+)\1/g,
        (_, q, importPath) => `from ${q}${mod.client}/${importPath.slice(2)}${q}`,
      )
      if (result === code) return
      return { code: result, map: null }
    },
  }
}

export default defineConfig({
  plugins: [react(), rewriteModuleAtImports()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: [
      // ── Shared enclave packages ───────────────────────────────────────────
      { find: '@enclave/sdk',      replacement: path.resolve(root, 'packages/sdk/src/index.ts') },
      { find: '@enclave/ui-shell', replacement: path.resolve(root, 'packages/ui-shell/src/index.ts') },
      // Pin ui-shell peer deps to dashboard node_modules (ui-shell has no own node_modules)
      { find: /^@venator-ui\/ui$/, replacement: path.resolve(__dirname, 'node_modules/@venator-ui/ui') },
      { find: /^lucide-react$/,    replacement: path.resolve(__dirname, 'node_modules/lucide-react') },

      // ── Dashboard catch-all ───────────────────────────────────────────────
      { find: '@', replacement: __dirname },
    ],
  },
})
