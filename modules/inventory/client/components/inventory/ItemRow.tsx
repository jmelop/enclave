import { CatBadge } from '@/components/ui/CatBadge'
import { StatusPill } from '@/components/ui/StatusPill'
import type { InventoryItem } from '@/types/inventory'

interface ItemRowProps {
  item: InventoryItem
  onOpen: (item: InventoryItem) => void
}

export function ItemRow({ item, onOpen }: ItemRowProps) {
  return (
    <button className="item-row" onClick={() => onOpen(item)}>
      <span className="ir-cat"><CatBadge catId={item.category} dense /></span>
      <span className="ir-name" title={item.name}>{item.name}</span>
      <span className="ir-model" title={item.model}>{item.model}</span>
      <span className="ir-qty">{item.qty}<span className="ir-qty-u">u</span></span>
      <span className="ir-status"><StatusPill status={item.status} micro /></span>
      <span className="ir-loc" title={item.location}>{item.location}</span>
      <span className="ir-notes" title={item.notes}>{item.notes}</span>
      <span className="ir-arrow">→</span>
    </button>
  )
}
