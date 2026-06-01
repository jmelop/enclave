import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const root      = path.resolve(__dirname, '../..')
const invClient = path.resolve(root, 'modules/inventory/client').replace(/\\/g, '/')
const bdgClient = path.resolve(root, 'modules/budget/client').replace(/\\/g, '/')
const labClient = path.resolve(root, 'modules/lab/client').replace(/\\/g, '/')
const strClient = path.resolve(root, 'modules/strategy/client').replace(/\\/g, '/')

const n = (p: string) => p.replace(/\\/g, '/').toLowerCase()

const MODULE_DIRS = [
  { dir: n(path.resolve(root, 'modules/inventory/client')), client: invClient },
  { dir: n(path.resolve(root, 'modules/budget/client')),    client: bdgClient },
  { dir: n(path.resolve(root, 'modules/lab/client')),       client: labClient },
  { dir: n(path.resolve(root, 'modules/strategy/client')),  client: strClient },
]

/**
 * Rewrites ALL `@/` imports from module files so that each module's source
 * resolves against its own client directory, not the dashboard root.
 *
 * This hook fires during Vite's dev-server transform phase (before
 * vite:import-analysis). The companion esbuildPlugin below mirrors
 * the same logic for the optimizeDeps pre-scan phase.
 */
function rewriteModuleAtImports(): Plugin {
  return {
    name: 'rewrite-module-at-imports',
    enforce: 'pre',
    transform(code, id) {
      if (!code.includes('@/')) return
      const idNorm = n(id)
      const mod = MODULE_DIRS.find(m => idNorm.startsWith(m.dir + '/'))
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

/**
 * esbuild plugin that mirrors rewriteModuleAtImports for the optimizeDeps
 * pre-scan. esbuild's onResolve fires during dep discovery, before Vite's
 * transform hooks, so the transform plugin alone is not enough.
 */
function esbuildModuleAtResolver() {
  return {
    name: 'esbuild-module-at-resolver',
    setup(build: { onResolve: (filter: { filter: RegExp }, cb: (args: { path: string; importer: string }) => { path: string } | null) => void }) {
      build.onResolve({ filter: /^@\// }, (args) => {
        if (!args.importer) return null
        const importerNorm = n(args.importer)
        const mod = MODULE_DIRS.find(m => importerNorm.startsWith(m.dir + '/'))
        if (!mod) return null
        const subPath = args.path.slice(2) // strip '@/'
        return { path: path.resolve(mod.client.replace(/\//g, path.sep), subPath) }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), rewriteModuleAtImports()],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [esbuildModuleAtResolver()],
    },
  },
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
