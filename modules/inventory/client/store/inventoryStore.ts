import { useMemo } from 'react'
import { create } from 'zustand'
import type { Category, CategoryId, CategoryInput, Density, InventoryItem, ItemInput, ItemStatus, SortDir, SortKey, ViewMode } from '@/types/inventory'
import { CATEGORIES } from '@/lib/seed'
import { deriveStatus } from '@/lib/utils'

// Raw shape returned by the API (no status — derived client-side; seed rows have no price).
type ApiItem = Omit<InventoryItem, 'status' | 'price'> & { price?: number | null }

async function fetchItems(): Promise<ApiItem[]> {
  const res = await fetch('/api/inventory/items')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as ApiItem[]
}

// Status depends on each item's category threshold, so it is re-derived whenever categories change.
function withStatus(items: ApiItem[], categories: Category[]): InventoryItem[] {
  const threshold = new Map(categories.map((c) => [c.id, c.lowThreshold]))
  return items.map((item) => ({ ...item, price: item.price ?? null, status: deriveStatus(item.qty, threshold.get(item.category)) }))
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/inventory/categories')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as Category[]
}

async function sendJson(url: string, method: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }
}

interface InventoryState {
  items: InventoryItem[]
  categories: Category[]
  loading: boolean
  error: string | null
  hydrated: boolean

  viewMode: ViewMode
  density: Density
  selectedCategory: CategoryId | null
  statusFilter: ItemStatus | null
  sortBy: SortKey
  sortDir: SortDir
  search: string
  selectedId: string | null   // stores only the id; item is derived live from items[]

  hydrate: () => Promise<void>
  refetch: () => Promise<void>
  createItem: (input: ItemInput) => Promise<void>
  updateItem: (id: string, input: ItemInput) => Promise<void>
  adjustQty: (id: string, delta: number) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  createCategory: (input: CategoryInput) => Promise<void>
  updateCategory: (id: CategoryId, input: CategoryInput) => Promise<void>

  setView: (mode: ViewMode) => void
  setDensity: (density: Density) => void
  setSearch: (q: string) => void
  setCategory: (cat: CategoryId | null) => void
  setStatusFilter: (s: ItemStatus | null) => void
  setSortBy: (key: SortKey) => void   // same key flips the direction
  setSelectedId: (id: string | null) => void
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  items: [],
  categories: CATEGORIES,
  loading: false,
  error: null,
  hydrated: false,

  viewMode: 'list',
  density: 'comfy',
  selectedCategory: null,
  statusFilter: null,
  sortBy: 'category',   // ties fall back to name
  sortDir: 'asc',
  search: '',
  selectedId: null,

  hydrate: async () => {
    if (get().hydrated || get().loading) return
    set({ loading: true, error: null })
    try {
      const [raw, categories] = await Promise.all([fetchItems(), fetchCategories()])
      set({ items: withStatus(raw, categories), categories, hydrated: true, error: null, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error', hydrated: false, loading: false })
    }
  },

  refetch: async () => {
    set({ loading: true, error: null })
    try {
      const [raw, categories] = await Promise.all([fetchItems(), fetchCategories()])
      set({ items: withStatus(raw, categories), categories, hydrated: true, error: null, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error', loading: false })
    }
  },

  createItem: async (input: ItemInput) => {
    const res = await fetch('/api/inventory/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  updateItem: async (id: string, input: ItemInput) => {
    const res = await fetch(`/api/inventory/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  adjustQty: async (id: string, delta: number) => {
    // TODO: history out of scope — see future branch feat/inventory-history
    const res = await fetch(`/api/inventory/items/${id}/qty`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  deleteItem: async (id: string) => {
    const res = await fetch(`/api/inventory/items/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  createCategory: async (input: CategoryInput) => {
    await sendJson('/api/inventory/categories', 'POST', input)
    set({ categories: await fetchCategories() })
  },

  updateCategory: async (id: CategoryId, input: CategoryInput) => {
    await sendJson(`/api/inventory/categories/${id}`, 'PUT', input)
    const categories = await fetchCategories()
    set({ categories, items: withStatus(get().items, categories) })
  },

  setView: (mode) => set({ viewMode: mode }),
  setDensity: (density) => set({ density }),
  setSearch: (search) => set({ search }),
  setCategory: (selectedCategory) => set({ selectedCategory }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSortBy: (key) => set((s) =>
    s.sortBy === key
      ? { sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' }
      : { sortBy: key, sortDir: key === 'qty' ? 'desc' : 'asc' }
  ),
  setSelectedId: (selectedId) => set({ selectedId }),
}))

// Derives the live selected item from items[] so qty stays fresh after adjustQty/refetch.
// Using a single selector: Zustand re-renders only when the returned item reference changes.
export function useSelectedItem(): InventoryItem | null {
  return useInventoryStore((s) =>
    s.selectedId == null ? null : (s.items.find((i) => i.id === s.selectedId) ?? null)
  )
}

export function useCategory(id: CategoryId | undefined): Category | undefined {
  return useInventoryStore((s) => s.categories.find((c) => c.id === id))
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

const STATUS_RANK: Record<ItemStatus, number> = { in: 0, low: 1, out: 2 }

function sortValue(it: InventoryItem, key: SortKey, catLabel: Map<string, string>): string | number {
  switch (key) {
    case 'qty':      return it.qty
    case 'status':   return STATUS_RANK[it.status]
    case 'category': return catLabel.get(it.category) ?? it.category
    default:         return it[key].trim()
  }
}

export function useFilteredItems() {
  const items            = useInventoryStore((s: InventoryState) => s.items)
  const search           = useInventoryStore((s: InventoryState) => s.search)
  const selectedCategory = useInventoryStore((s: InventoryState) => s.selectedCategory)
  const statusFilter     = useInventoryStore((s: InventoryState) => s.statusFilter)
  const sortBy           = useInventoryStore((s: InventoryState) => s.sortBy)
  const sortDir          = useInventoryStore((s: InventoryState) => s.sortDir)
  const categories       = useInventoryStore((s: InventoryState) => s.categories)

  return useMemo(() => {
    const q = search.trim().toLowerCase()
    const out = items.filter((it) => {
      if (selectedCategory && it.category !== selectedCategory) return false
      if (statusFilter && it.status !== statusFilter) return false
      if (!q) return true
      return [it.name, it.model, it.location, it.notes].some(
        (v) => v && v.toLowerCase().includes(q),
      )
    })
    const catLabel = new Map(categories.map((c) => [c.id, c.label]))
    const sign = sortDir === 'asc' ? 1 : -1
    out.sort((a, b) => {
      const va = sortValue(a, sortBy, catLabel)
      const vb = sortValue(b, sortBy, catLabel)
      // Empty text cells stay at the bottom in both directions.
      if (va === '' || vb === '') return va === vb ? 0 : va === '' ? 1 : -1
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : collator.compare(String(va), String(vb))
      return cmp * sign || collator.compare(a.name, b.name)
    })
    return out
  }, [items, search, selectedCategory, statusFilter, sortBy, sortDir, categories])
}
