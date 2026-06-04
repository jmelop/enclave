export type ItemStatus = 'in' | 'low' | 'out'

export type CategoryId = 'pc' | 'mcu' | 'elec' | 'tools' | 'cable' | 'other'

export interface Category {
  id: CategoryId
  label: string
  short: string
  hue: number
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
  status: ItemStatus   // derived client-side via deriveStatus(qty); not persisted in DB
  location: string
  notes: string
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
}

export type ViewMode = 'grid' | 'list'

export type Density = 'compact' | 'default' | 'comfy'
