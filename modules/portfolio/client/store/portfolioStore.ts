import { create } from 'zustand'
import type { Asset, AllocationTarget, FXRate, PortfolioState, AssetInput, PortfolioSnapshot } from '../types/portfolio'
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

async function fetchSnapshots(): Promise<PortfolioSnapshot[]> {
  const res = await fetch('/api/portfolio/history')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as PortfolioSnapshot[]
}

export interface PriceRefreshResult {
  updated: number
  failed: string[]
  skipped: string[]
}

async function postPriceRefresh(): Promise<PriceRefreshResult> {
  const res = await fetch('/api/portfolio/prices/refresh', { method: 'POST' })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return (await res.json()) as PriceRefreshResult
}

async function postSnapshot(): Promise<PortfolioSnapshot> {
  const res = await fetch('/api/portfolio/history/snapshot', { method: 'POST' })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return (await res.json()) as PortfolioSnapshot
}

interface Store extends PortfolioState {
  snapshots: PortfolioSnapshot[]
  setAssets: (assets: Asset[]) => void
  setLastSync: (ts: string) => void
  loading: boolean
  historyLoading: boolean
  pricesLoading: boolean
  error: string | null
  historyError: string | null
  hydrated: boolean
  hydrate: () => Promise<void>
  refetch: () => Promise<void>
  refreshPrices: () => Promise<PriceRefreshResult>
  fetchHistory: () => Promise<void>
  captureSnapshot: () => Promise<void>
  createAsset: (input: AssetInput) => Promise<void>
  updateAsset: (id: string, input: AssetInput) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
}

export const usePortfolioStore = create<Store>()((set, get) => ({
  assets: [],
  snapshots: [],
  targets,
  fxRates,
  lastSync: '2026-05-18T23:15:00Z',
  loading: false,
  historyLoading: false,
  pricesLoading: false,
  error: null,
  historyError: null,
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
  refreshPrices: async () => {
    set({ pricesLoading: true })
    try {
      const result = await postPriceRefresh()
      const assets = await fetchHoldings()
      set({ assets, lastSync: new Date().toISOString(), pricesLoading: false })
      return result
    } catch (err) {
      set({ pricesLoading: false })
      throw err
    }
  },
  fetchHistory: async () => {
    set({ historyLoading: true, historyError: null })
    try {
      const snapshots = await fetchSnapshots()
      set({ snapshots, historyLoading: false, historyError: null })
    } catch (err) {
      set({
        historyError: err instanceof Error ? err.message : 'Network error',
        historyLoading: false,
      })
    }
  },
  captureSnapshot: async () => {
    set({ historyLoading: true, historyError: null })
    try {
      await postSnapshot()
      const snapshots = await fetchSnapshots()
      set({ snapshots, historyLoading: false, historyError: null })
    } catch (err) {
      set({
        historyError: err instanceof Error ? err.message : 'Network error',
        historyLoading: false,
      })
      throw err
    }
  },
  updateAsset: async (id: string, input: AssetInput) => {
    const res = await fetch(`/api/portfolio/holdings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json() as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },
  deleteAsset: async (id: string) => {
    const res = await fetch(`/api/portfolio/holdings/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json() as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
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
