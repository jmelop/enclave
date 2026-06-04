import { useMemo } from 'react'
import { create } from 'zustand'
import type { CategoryId, Density, InventoryItem, ItemInput, ItemStatus, ViewMode } from '@/types/inventory'
import { CATEGORIES } from '@/lib/seed'
import { deriveStatus } from '@/lib/utils'

export { CATEGORIES }

// Raw shape returned by the API (no status — derived client-side).
type ApiItem = Omit<InventoryItem, 'status'>

async function fetchItems(): Promise<InventoryItem[]> {
  const res = await fetch('/api/inventory/items')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const raw = (await res.json()) as ApiItem[]
  return raw.map((item) => ({ ...item, status: deriveStatus(item.qty) }))
}

interface InventoryState {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  hydrated: boolean

  viewMode: ViewMode
  density: Density
  selectedCategory: CategoryId | null
  statusFilter: ItemStatus | null
  sortBy: 'id' | 'name' | 'qty'
  search: string
  selectedId: string | null   // stores only the id; item is derived live from items[]

  hydrate: () => Promise<void>
  refetch: () => Promise<void>
  createItem: (input: ItemInput) => Promise<void>
  updateItem: (id: string, input: ItemInput) => Promise<void>
  adjustQty: (id: string, delta: number) => Promise<void>
  deleteItem: (id: string) => Promise<void>

  setView: (mode: ViewMode) => void
  setDensity: (density: Density) => void
  setSearch: (q: string) => void
  setCategory: (cat: CategoryId | null) => void
  setStatusFilter: (s: ItemStatus | null) => void
  setSortBy: (s: 'id' | 'name' | 'qty') => void
  setSelectedId: (id: string | null) => void
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  items: [],
  loading: false,
  error: null,
  hydrated: false,

  viewMode: 'list',
  density: 'comfy',
  selectedCategory: null,
  statusFilter: null,
  sortBy: 'id',
  search: '',
  selectedId: null,

  hydrate: async () => {
    if (get().hydrated || get().loading) return
    set({ loading: true, error: null })
    try {
      const items = await fetchItems()
      set({ items, hydrated: true, error: null, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error', hydrated: false, loading: false })
    }
  },

  refetch: async () => {
    set({ loading: true, error: null })
    try {
      const items = await fetchItems()
      set({ items, hydrated: true, error: null, loading: false })
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
    // TODO: historial fuera de alcance — ver rama futura feat/inventory-history
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

  setView: (mode) => set({ viewMode: mode }),
  setDensity: (density) => set({ density }),
  setSearch: (search) => set({ search }),
  setCategory: (selectedCategory) => set({ selectedCategory }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSelectedId: (selectedId) => set({ selectedId }),
}))

// Derives the live selected item from items[] so qty stays fresh after adjustQty/refetch.
// Using a single selector: Zustand re-renders only when the returned item reference changes.
export function useSelectedItem(): InventoryItem | null {
  return useInventoryStore((s) =>
    s.selectedId == null ? null : (s.items.find((i) => i.id === s.selectedId) ?? null)
  )
}

export function useFilteredItems() {
  const items            = useInventoryStore((s: InventoryState) => s.items)
  const search           = useInventoryStore((s: InventoryState) => s.search)
  const selectedCategory = useInventoryStore((s: InventoryState) => s.selectedCategory)
  const statusFilter     = useInventoryStore((s: InventoryState) => s.statusFilter)
  const sortBy           = useInventoryStore((s: InventoryState) => s.sortBy)

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
    out.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'qty') return b.qty - a.qty
      return a.id.localeCompare(b.id)
    })
    return out
  }, [items, search, selectedCategory, statusFilter, sortBy])
}
