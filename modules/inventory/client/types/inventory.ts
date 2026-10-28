export type ItemStatus = 'in' | 'low' | 'out'

// User-defined slug from inventory_categories (e.g. 'elec', 'pla-filament').
export type CategoryId = string

export interface Category {
  id: CategoryId
  label: string
  short: string
  hue: number
  lowThreshold: number   // items show as low when 0 < qty <= lowThreshold
}

// Fields accepted by POST /categories and PUT /categories/:id
export interface CategoryInput {
  label: string
  short: string
  hue: number
  lowThreshold: number
}

// TODO: historial fuera de alcance — ver rama futura feat/inventory-history
// export interface HistoryEntry {
//   d: string
//   q: number
//   why: string
// }

export interface InventoryItem {
  id: string
  name: string
  category: CategoryId
  model: string
  qty: number
  status: ItemStatus   // derived client-side via deriveStatus(qty, category threshold); not persisted in DB
  location: string
  notes: string
  price: number | null   // unit price in EUR; null = unknown
  updated: string
}

// Fields accepted by POST /items and PUT /items/:id
export interface ItemInput {
  name: string
  category: CategoryId
  model: string
  qty: number
  location: string
  notes: string
  price: number | null
}

export type ViewMode = 'grid' | 'list'

export type SortKey = 'category' | 'name' | 'model' | 'qty' | 'status' | 'location' | 'notes'

export type SortDir = 'asc' | 'desc'

export type Density = 'compact' | 'default' | 'comfy'
