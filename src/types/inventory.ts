export type ItemStatus = 'in' | 'low' | 'out'

export type CategoryId = 'pc' | 'mcu' | 'elec' | 'tools' | 'cable' | 'other'

export interface Category {
  id: CategoryId
  label: string
  short: string
  hue: number
}

export interface HistoryEntry {
  d: string
  q: number
  why: string
}

export interface InventoryItem {
  id: string
  name: string
  category: CategoryId
  model: string
  qty: number
  status: ItemStatus
  location: string
  notes: string
  updated: string
}

export type ViewMode = 'grid' | 'list'

export type Density = 'compact' | 'default' | 'comfy'
