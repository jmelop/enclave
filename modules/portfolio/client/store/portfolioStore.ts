import { create } from 'zustand'
import type { Asset, AllocationTarget, FXRate, PortfolioState, AssetInput } from '../types/portfolio'
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

async function fetchHoldings(): Promise<Asset[]> {
  const res = await fetch('/api/portfolio/holdings')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as Asset[]
}

interface Store extends PortfolioState {
  setAssets: (assets: Asset[]) => void
  setLastSync: (ts: string) => void
  loading: boolean
  error: string | null
  hydrated: boolean
  hydrate: () => Promise<void>
  refetch: () => Promise<void>
  createAsset: (input: AssetInput) => Promise<void>
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
  setLastSync: (lastSync) => set({ lastSync }),
  hydrate: async () => {
    if (get().hydrated || get().loading) return
    set({ loading: true, error: null })
    try {
      const assets = await fetchHoldings()
      set({ assets, hydrated: true, error: null, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Network error',
        hydrated: false,
        loading: false,
      })
    }
  },
  refetch: async () => {
    set({ loading: true, error: null })
    try {
      const assets = await fetchHoldings()
      set({ assets, hydrated: true, error: null, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Network error',
        loading: false,
      })
    }
  },
  createAsset: async (input: AssetInput) => {
    const res = await fetch('/api/portfolio/holdings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json() as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },
}))
