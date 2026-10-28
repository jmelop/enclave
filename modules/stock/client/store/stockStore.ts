import { useMemo } from 'react'
import { create } from 'zustand'
import type { LedgerProduct, ProductInput, ProductMetrics, SortDir, SortKey, StockFilter, StockProduct } from '@/types/stock'
import { hasPlatform, parsePlatforms } from '@/lib/utils'

const API = '/api/stock/products'

async function fetchProducts(): Promise<StockProduct[]> {
  const res = await fetch(API)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as StockProduct[]
}

async function send(url: string, method: string, body?: unknown): Promise<StockProduct> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }
  return (await res.json()) as StockProduct
}

function toInput(p: StockProduct): ProductInput {
  const { name, quantity, unit_cost, sale_price, platforms, sales_count, notes } = p
  return { name, quantity, unit_cost, sale_price, platforms, sales_count, notes }
}

interface StockState {
  products: StockProduct[]
  draftIds: string[]      // new products not saved yet; they only live while their sheet is open
  edits: Partial<ProductInput>   // unsaved changes to the open product
  saving: boolean
  loading: boolean
  error: string | null
  saveError: string | null
  hydrated: boolean

  openId: string | null
  focusId: string | null  // row whose name input grabs focus once
  newIds: string[]        // created this session, pinned on top until reload
  query: string
  platformFilter: string | null
  stockFilter: StockFilter
  sortBy: SortKey
  sortDir: SortDir

  hydrate: () => Promise<void>
  refetch: () => Promise<void>
  addProduct: () => void
  editOpen: (changes: Partial<ProductInput>) => void
  saveOpen: () => Promise<void>
  cancelOpen: () => void
  sell: (id: string) => Promise<void>
  undoSale: (id: string) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  clearSaveError: () => void

  toggleOpen: (id: string) => void
  setOpenId: (id: string | null) => void   // asks before discarding unsaved changes
  setQuery: (q: string) => void
  setPlatformFilter: (p: string | null) => void
  setStockFilter: (f: StockFilter) => void
  setSortBy: (key: SortKey) => void   // same key flips the direction
}

export const useStockStore = create<StockState>()((set, get) => {
  // A failed write leaves local state unknown: surface the error and resync from the server.
  const fail = async (err: unknown) => {
    set({ saveError: err instanceof Error ? err.message : 'Network error' })
    await get().refetch()
  }

  // Drops the open sheet's edits, and the product itself if it was never saved.
  const discardOpen = () => {
    const { openId, draftIds } = get()
    const draft = openId != null && draftIds.includes(openId)
    set((s) => ({
      edits: {},
      products: draft ? s.products.filter((x) => x.id !== openId) : s.products,
      draftIds: draft ? s.draftIds.filter((d) => d !== openId) : s.draftIds,
      newIds: draft ? s.newIds.filter((d) => d !== openId) : s.newIds,
    }))
  }

  // false when the user keeps their unsaved changes.
  const leaveOpen = (): boolean => {
    if (Object.keys(get().edits).length > 0 && !window.confirm('Discard unsaved changes?')) return false
    discardOpen()
    return true
  }

  // Optimistic ±1 sale, confirmed by the atomic endpoint.
  const moveSale = async (id: string, dir: 1 | -1) => {
    const p = get().products.find((x) => x.id === id)
    if (!p || get().draftIds.includes(id)) return
    if (dir === 1 ? p.quantity === 0 : p.sales_count === 0) return
    set((s) => ({
      products: s.products.map((x) => (x.id === id ? { ...x, quantity: x.quantity - dir, sales_count: x.sales_count + dir } : x)),
    }))
    try {
      const saved = await send(`${API}/${id}/${dir === 1 ? 'sell' : 'unsell'}`, 'POST')
      set((s) => ({
        products: s.products.map((x) => (x.id === id
          ? { ...x, quantity: saved.quantity, sales_count: saved.sales_count, updated_at: saved.updated_at }
          : x)),
      }))
    } catch (err) {
      await fail(err)
    }
  }

  return {
    products: [],
    draftIds: [],
    edits: {},
    saving: false,
    loading: false,
    error: null,
    saveError: null,
    hydrated: false,

    openId: null,
    focusId: null,
    newIds: [],
    query: '',
    platformFilter: null,
    stockFilter: 'all',
    sortBy: 'seq',
    sortDir: 'asc',

    hydrate: async () => {
      if (get().hydrated || get().loading) return
      await get().refetch()
    },

    refetch: async () => {
      set({ loading: true, error: null })
      try {
        const server = await fetchProducts()
        set((s) => ({
          products: [...server, ...s.products.filter((p) => s.draftIds.includes(p.id))],
          hydrated: true,
          error: null,
          loading: false,
        }))
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Network error', loading: false })
      }
    },

    addProduct: () => {
      if (!leaveOpen()) return
      const id = `draft-${Date.now()}`
      const ts = new Date().toISOString()
      set((s) => ({
        products: [...s.products, { id, name: '', quantity: 0, unit_cost: 0, sale_price: 0, platforms: null, sales_count: 0, notes: '', created_at: ts, updated_at: ts }],
        draftIds: [...s.draftIds, id],
        newIds: [...s.newIds, id],
        openId: id,
        focusId: id,
        query: '',
        platformFilter: null,
        stockFilter: 'all',
      }))
    },

    // Fields set back to the saved value stop counting as changes.
    editOpen: (changes) => {
      const p = get().products.find((x) => x.id === get().openId)
      if (!p) return
      const edits = { ...get().edits, ...changes }
      for (const k of Object.keys(edits) as (keyof ProductInput)[]) {
        if (edits[k] === p[k]) delete edits[k]
      }
      set({ edits })
    },

    saveOpen: async () => {
      const { openId, edits, products, draftIds, saving } = get()
      const p = products.find((x) => x.id === openId)
      if (!p || saving || Object.keys(edits).length === 0) return
      const input = { ...toInput(p), ...edits }
      if (!input.name.trim()) return
      set({ saving: true })
      try {
        if (draftIds.includes(p.id)) {
          const saved = await send(API, 'POST', input)
          const swap = (v: string) => (v === p.id ? saved.id : v)
          set((s) => ({
            products: s.products.map((x) => (x.id === p.id ? saved : x)),
            draftIds: s.draftIds.filter((d) => d !== p.id),
            newIds: s.newIds.map(swap),
            openId: s.openId && swap(s.openId),
            edits: {},
            focusId: null,
          }))
          // GET served seed rows while the table was empty; resyncing drops them.
          await get().refetch()
        } else {
          const saved = await send(`${API}/${p.id}`, 'PUT', input)
          set((s) => ({ products: s.products.map((x) => (x.id === p.id ? saved : x)), edits: {} }))
        }
      } catch (err) {
        await fail(err)
      } finally {
        set({ saving: false })
      }
    },

    cancelOpen: () => {
      discardOpen()
      set({ openId: null, focusId: null })
    },

    sell: (id) => moveSale(id, 1),
    undoSale: (id) => moveSale(id, -1),

    deleteProduct: async (id) => {
      const isDraft = get().draftIds.includes(id)
      set((s) => ({
        products: s.products.filter((x) => x.id !== id),
        draftIds: s.draftIds.filter((d) => d !== id),
        edits: s.openId === id ? {} : s.edits,
        openId: s.openId === id ? null : s.openId,
      }))
      if (isDraft) return
      try {
        const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(data.error ?? `HTTP ${res.status}`)
        }
      } catch (err) {
        await fail(err)
      }
    },

    clearSaveError: () => set({ saveError: null }),

    toggleOpen: (id) => {
      const next = get().openId === id ? null : id
      if (!leaveOpen()) return
      set({ openId: next, focusId: null })
    },
    setOpenId: (openId) => {
      if (openId === get().openId || !leaveOpen()) return
      set({ openId, focusId: null })
    },
    setQuery: (query) => set({ query }),
    setPlatformFilter: (platformFilter) => set({ platformFilter }),
    setStockFilter: (stockFilter) => set({ stockFilter }),
    setSortBy: (key) => set((s) =>
      s.sortBy === key
        ? { sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy: key, sortDir: key === 'name' || key === 'seq' ? 'asc' : 'desc' }
    ),
  }
})

// ─── Derived values ───────────────────────────────────────────────────────────
// The only place margin, sell-through and money totals are computed.

export function productMetrics(p: StockProduct): ProductMetrics {
  const margin = p.sale_price - p.unit_cost
  const total  = p.sales_count + p.quantity
  return {
    margin,
    marginPct:  p.sale_price > 0 ? margin / p.sale_price : 0,
    through:    total > 0 ? p.sales_count / total : 0,
    stockCost:  p.quantity * p.unit_cost,
    leftToEarn: p.quantity * margin,
    revenue:    p.sales_count * p.sale_price,
    profit:     p.sales_count * margin,
  }
}

export interface StockTotals {
  products: number
  units: number
  sold: number
  soldOut: number
  belowCost: number
  stockCost: number
  leftToEarn: number
  revenue: number
  profit: number
}

export function sumProducts(list: StockProduct[]): StockTotals {
  return list.reduce<StockTotals>((t, p) => {
    const m = productMetrics(p)
    t.products   += 1
    t.units      += p.quantity
    t.sold       += p.sales_count
    t.soldOut    += p.quantity === 0 ? 1 : 0
    t.belowCost  += p.sale_price < p.unit_cost ? 1 : 0
    t.stockCost  += m.stockCost
    t.leftToEarn += m.leftToEarn
    t.revenue    += m.revenue
    t.profit     += m.profit
    return t
  }, { products: 0, units: 0, sold: 0, soldOut: 0, belowCost: 0, stockCost: 0, leftToEarn: 0, revenue: 0, profit: 0 })
}

// Totals over every product, ignoring filters (ticker + topbar alerts).
export function useStockTotals(): StockTotals {
  const products = useStockStore((s) => s.products)
  return useMemo(() => sumProducts(products), [products])
}

// Platforms in use, most common first, deduped case-insensitively.
export function usePlatforms(): [string, number][] {
  const products = useStockStore((s) => s.products)
  return useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      for (const name of parsePlatforms(p.platforms)) {
        const key = [...counts.keys()].find((k) => k.toLowerCase() === name.toLowerCase()) ?? name
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [products])
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function sortValue(p: LedgerProduct, key: SortKey): string | number {
  return key === 'margin' ? p.metrics.margin : p[key]
}

// Filtered + sorted ledger rows. seq follows creation order over all products.
export function useLedgerRows(): LedgerProduct[] {
  const products       = useStockStore((s) => s.products)
  const draftIds       = useStockStore((s) => s.draftIds)
  const newIds         = useStockStore((s) => s.newIds)
  const query          = useStockStore((s) => s.query)
  const platformFilter = useStockStore((s) => s.platformFilter)
  const stockFilter    = useStockStore((s) => s.stockFilter)
  const sortBy         = useStockStore((s) => s.sortBy)
  const sortDir        = useStockStore((s) => s.sortDir)

  return useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = products
      .map((p, i): LedgerProduct => ({ ...p, seq: i + 1, draft: draftIds.includes(p.id), metrics: productMetrics(p) }))
      .filter((p) => {
        if (stockFilter === 'in' && p.quantity === 0) return false
        if (stockFilter === 'out' && p.quantity > 0) return false
        if (platformFilter && !hasPlatform(parsePlatforms(p.platforms), platformFilter)) return false
        return !q || p.name.toLowerCase().includes(q) || (p.platforms ?? '').toLowerCase().includes(q)
      })
    const sign = sortDir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const pinA = newIds.includes(a.id), pinB = newIds.includes(b.id)
      if (pinA !== pinB) return pinA ? -1 : 1
      const va = sortValue(a, sortBy), vb = sortValue(b, sortBy)
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : collator.compare(String(va), String(vb))
      return cmp * sign || a.seq - b.seq
    })
    return rows
  }, [products, draftIds, newIds, query, platformFilter, stockFilter, sortBy, sortDir])
}
