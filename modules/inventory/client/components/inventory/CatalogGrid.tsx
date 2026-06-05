import { ItemCard } from './ItemCard'
import type { Density, InventoryItem } from '@/types/inventory'

interface CatalogGridProps {
  items: InventoryItem[]
  density: Density
  onOpen: (item: InventoryItem) => void
}

export function CatalogGrid({ items, density, onOpen }: CatalogGridProps) {
  return (
    <div className={`catalog-grid dense-${density}`}>
      {items.map((item, idx) => (
        <ItemCard key={item.id} item={item} index={idx + 1} onOpen={onOpen} />
      ))}
    </div>
  )
}
