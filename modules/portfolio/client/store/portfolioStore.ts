import { create } from 'zustand'
import type { Asset, AllocationTarget, FXRate, PortfolioState } from '../types/portfolio'
import { CATEGORY_ORDER, TARGETS } from '../lib/utils'

const fxRates: FXRate[] = [
  { from: 'USD', to: 'EUR', rate: 0.92 },
  { from: 'GBP', to: 'EUR', rate: 1.17 },
  { from: 'CHF', to: 'EUR', rate: 1.06 },
]

const targets: AllocationTarget[] = CATEGORY_ORDER.map((cat) => ({
  category: cat,
  targetPct: TARGETS[cat],
}))

interface Store extends PortfolioState {
  setAssets: (assets: Asset[]) => void
  addAsset: (asset: Asset) => void
  setLastSync: (ts: string) => void
  loading: boolean
  error: string | null
  hydrated: boolean
  hydrate: () => Promise<void>
}

export const usePortfolioStore = create<Store>()((set, get) => ({
  assets: [],
  targets,
  fxRates,
  lastSync: '2026-05-18T23:15:00Z',
  loading: false,
  error: null,
  hydrated: false,
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  setLastSync: (lastSync) => set({ lastSync }),
  hydrate: async () => {
    if (get().hydrated || get().loading) return
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/portfolio/holdings')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as Asset[]
      set({ assets: json, hydrated: true, error: null, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Network error',
        hydrated: false,
        loading: false,
      })
    }
  },
}))
