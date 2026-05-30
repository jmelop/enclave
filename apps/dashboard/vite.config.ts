import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const root      = path.resolve(__dirname, '../..')
const invClient = path.resolve(root, 'modules/inventory/client').replace(/\\/g, '/')
const bdgClient = path.resolve(root, 'modules/budget/client').replace(/\\/g, '/')

/**
 * `@/lib/utils` and `@/lib/seed` exist in BOTH inventory and budget but
 * resolve to different files.  Static Vite aliases can't disambiguate because
 * they are global (no per-importer context).
 *
 * The `resolveId` hook also can't help: in Vite 5, `resolve.alias` processing
 * happens before user pre-plugins' resolveId, so the `@` catch-all has already
 * rewritten the id to an absolute dashboard path by the time our hook fires.
 *
 * The `transform` hook runs BEFORE `vite:import-analysis` even when that
 * analysis is what discovers the import.  We rewrite the specifier in-source
 * so import-analysis sees an absolute path that resolves cleanly.
 */
function rewriteConflictingAtImports(): Plugin {
  const n = (p: string) => p.replace(/\\/g, '/').toLowerCase()

  const MODULES = [
    { dir: n(path.resolve(root, 'modules/inventory/client')), client: invClient },
    { dir: n(path.resolve(root, 'modules/budget/client')),    client: bdgClient },
  ]

  return {
    name: 'rewrite-conflicting-at-imports',
    enforce: 'pre',
    transform(code, id) {
      if (!/@\/lib\/(utils|seed)/.test(code)) return   // fast exit

      const idNorm = n(id)
      const mod = MODULES.find(m => idNorm.startsWith(m.dir + '/'))
      if (!mod) return

      const result = code.replace(
        /from\s*(["'])@\/lib\/(utils|seed)\1/g,
        (_, q, name) => `from ${q}${mod.client}/lib/${name}.ts${q}`,
      )

      if (result === code) return
      return { code: result, map: null }
    },
  }
}

export default defineConfig({
  plugins: [react(), rewriteConflictingAtImports()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: [
      // ── Inventory @/ paths ────────────────────────────────────────────────
      { find: /^@\/components\/inventory\/(.+)/, replacement: `${invClient}/components/inventory/$1` },
      { find: /^@\/components\/ui\/(.+)/,        replacement: `${invClient}/components/ui/$1` },
      { find: '@/store/inventoryStore',           replacement: `${invClient}/store/inventoryStore.ts` },
      { find: '@/types/inventory',               replacement: `${invClient}/types/inventory.ts` },

      // ── Budget @/ paths ───────────────────────────────────────────────────
      { find: /^@\/components\/budget\/(.+)/, replacement: `${bdgClient}/components/budget/$1` },
      { find: /^@\/pages\/(.+)/,              replacement: `${bdgClient}/pages/$1` },
      { find: '@/store/budgetStore',          replacement: `${bdgClient}/store/budgetStore.ts` },
      { find: '@/types/budget',              replacement: `${bdgClient}/types/budget.ts` },

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
