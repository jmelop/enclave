import { CatBadge } from '@/components/ui/CatBadge'
import { StatusPill } from '@/components/ui/StatusPill'
import type { InventoryItem } from '@/types/inventory'

interface ItemRowProps {
  item: InventoryItem
  index: number
  showCoord?: boolean
  onOpen: (item: InventoryItem) => void
}

export function ItemRow({ item, index, showCoord = true, onOpen }: ItemRowProps) {
  return (
    <button className="item-row" onClick={() => onOpen(item)}>
      {showCoord && <span className="ir-idx">#{String(index).padStart(3, '0')}</span>}
      <span className="ir-cat"><CatBadge catId={item.category} dense /></span>
      <span className="ir-name">{item.name}</span>
      <span className="ir-model">{item.model}</span>
      <span className="ir-qty">{item.qty}<span className="ir-qty-u">u</span></span>
      <span className="ir-status"><StatusPill status={item.status} micro /></span>
      <span className="ir-loc">{item.location}</span>
      <span className="ir-arrow">→</span>
    </button>
  )
}
