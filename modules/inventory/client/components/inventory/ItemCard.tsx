import { CatBadge } from '@/components/ui/CatBadge'
import { StatusPill } from '@/components/ui/StatusPill'
import { Bracket } from '@/components/ui/Bracket'
import { catAccent } from '@/lib/utils'
import { CATEGORIES } from '@/store/inventoryStore'
import type { InventoryItem } from '@/types/inventory'

interface ItemCardProps {
  item: InventoryItem
  showCoord?: boolean
  onOpen: (item: InventoryItem) => void
}

export function ItemCard({ item, showCoord = true, onOpen }: ItemCardProps) {
  const c = CATEGORIES.find((x) => x.id === item.category)
  const accent = c ? catAccent(c.hue) : 'var(--fg)'

  return (
    <button className="item-card" onClick={() => onOpen(item)}>
      <span
        className="card-accent"
        style={{ background: `linear-gradient(180deg, ${accent}, transparent 80%)` }}
      />
      <Bracket corner="tl" />
      <Bracket corner="tr" />
      <Bracket corner="bl" />
      <Bracket corner="br" />
      <div className="ic-top">
        {showCoord && <span className="ic-coord">#{item.id}</span>}
        <CatBadge catId={item.category} />
        <StatusPill status={item.status} micro />
      </div>
      <div className="ic-name">{item.name}</div>
      <div className="ic-model">{item.model}</div>
      <div className="ic-qty-row">
        <div className="ic-qty">
          <span className="qty-num">{item.qty}</span>
          <span className="qty-lbl">units</span>
        </div>
        <div className="ic-loc">
          <span className="loc-mark">◆</span>
          <span className="loc-text">{item.location}</span>
        </div>
      </div>
      <div className="ic-notes">{item.notes}</div>
    </button>
  )
}
