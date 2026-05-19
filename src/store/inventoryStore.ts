import { create } from 'zustand'
import type { CategoryId, Density, HistoryEntry, InventoryItem, ItemStatus, ViewMode } from '@/types/inventory'
import { CATEGORIES, SEED_HISTORY, SEED_ITEMS } from '@/lib/seed'
import { deriveStatus, padId, today } from '@/lib/utils'

export { CATEGORIES }

interface InventoryState {
  items: InventoryItem[]
  history: Record<string, HistoryEntry[]>
  viewMode: ViewMode
  density: Density
  selectedCategory: CategoryId | null
  statusFilter: ItemStatus | null
  sortBy: 'id' | 'name' | 'qty'
  search: string
  selectedItem: InventoryItem | null

  addItem: (draft: Omit<InventoryItem, 'id' | 'status' | 'updated'> & { qty: number }) => void
  updateItem: (item: InventoryItem) => void
  deleteItem: (id: string) => void
  adjustQty: (id: string, delta: number) => void
  setView: (mode: ViewMode) => void
  setDensity: (density: Density) => void
  setSearch: (q: string) => void
  setCategory: (cat: CategoryId | null) => void
  setStatusFilter: (s: ItemStatus | null) => void
  setSortBy: (s: 'id' | 'name' | 'qty') => void
  setSelectedItem: (item: InventoryItem | null) => void
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: SEED_ITEMS,
  history: SEED_HISTORY,
  viewMode: 'list',
  density: 'comfy',
  selectedCategory: null,
  statusFilter: null,
  sortBy: 'id',
  search: '',
  selectedItem: null,

  addItem: (draft) => {
    const { items } = get()
    const id = padId(items.length + 1)
    const qty = Number(draft.qty) || 0
    const newItem: InventoryItem = {
      ...draft,
      id,
      qty,
      status: deriveStatus(qty),
      updated: today(),
    }
    set((s) => ({ items: [...s.items, newItem] }))
  },

  updateItem: (item) => {
    const qty = Number(item.qty) || 0
    const updated: InventoryItem = {
      ...item,
      qty,
      status: deriveStatus(qty),
      updated: today(),
    }
    set((s) => ({
      items: s.items.map((p) => (p.id === item.id ? updated : p)),
      selectedItem: s.selectedItem?.id === item.id ? updated : s.selectedItem,
    }))
  },

  deleteItem: (id) => {
    set((s) => ({
      items: s.items.filter((p) => p.id !== id),
      selectedItem: s.selectedItem?.id === id ? null : s.selectedItem,
    }))
  },

  adjustQty: (id, delta) => {
    const { items } = get()
    const item = items.find((p) => p.id === id)
    if (!item) return
    const next = Math.max(0, item.qty + delta)
    const newStatus = deriveStatus(next)
    const entry: HistoryEntry = {
      d: today(),
      q: next,
      why: delta > 0 ? `+${delta} manual` : `${delta} manual`,
    }
    set((s) => ({
      items: s.items.map((p) =>
        p.id === id ? { ...p, qty: next, status: newStatus, updated: today() } : p,
      ),
      history: {
        ...s.history,
        [id]: [...(s.history[id] ?? []), entry],
      },
      selectedItem:
        s.selectedItem?.id === id
          ? { ...s.selectedItem, qty: next, status: newStatus, updated: today() }
          : s.selectedItem,
    }))
  },

  setView: (mode) => set({ viewMode: mode }),
  setDensity: (density) => set({ density }),
  setSearch: (search) => set({ search }),
  setCategory: (selectedCategory) => set({ selectedCategory }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
}))

export function useFilteredItems() {
  return useInventoryStore((s) => {
    const q = s.search.trim().toLowerCase()
    let out = s.items.filter((it) => {
      if (s.selectedCategory && it.category !== s.selectedCategory) return false
      if (s.statusFilter && it.status !== s.statusFilter) return false
      if (!q) return true
      return [it.name, it.model, it.location, it.notes].some(
        (v) => v && v.toLowerCase().includes(q),
      )
    })
    out.sort((a, b) => {
      if (s.sortBy === 'name') return a.name.localeCompare(b.name)
      if (s.sortBy === 'qty') return b.qty - a.qty
      return a.id.localeCompare(b.id)
    })
    return out
  })
}
