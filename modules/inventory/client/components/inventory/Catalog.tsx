import { CatalogGrid } from './CatalogGrid'
import { CatalogList } from './CatalogList'
import type { Density, InventoryItem, ViewMode } from '@/types/inventory'

interface CatalogProps {
  items: InventoryItem[]
  viewMode: ViewMode
  density: Density
  onOpen: (item: InventoryItem) => void
}

export function Catalog({ items, viewMode, density, onOpen }: CatalogProps) {
  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty-mark">/dev/null</div>
        <div className="empty-text">No items match the current filter.</div>
        <div className="empty-sub mono">try clearing search · or add a new item</div>
      </div>
    )
  }

  if (viewMode === 'list') {
    return <CatalogList items={items} density={density} onOpen={onOpen} />
  }

  return <CatalogGrid items={items} density={density} onOpen={onOpen} />
}
