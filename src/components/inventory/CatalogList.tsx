import { ItemRow } from './ItemRow'
import type { Density, InventoryItem } from '@/types/inventory'

interface CatalogListProps {
  items: InventoryItem[]
  density: Density
  onOpen: (item: InventoryItem) => void
}

export function CatalogList({ items, density, onOpen }: CatalogListProps) {
  return (
    <div className={`catalog-list dense-${density}`}>
      <div className="list-head mono">
        <span></span>
        <span>CAT</span>
        <span>NAME</span>
        <span>MODEL</span>
        <span>QTY</span>
        <span>STATUS</span>
        <span>LOCATION</span>
        <span></span>
      </div>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  )
}
