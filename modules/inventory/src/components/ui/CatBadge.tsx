import { CATEGORIES } from '@/store/inventoryStore'
import { catBg, catBorder, catDot, catFg } from '@/lib/utils'
import type { CategoryId } from '@/types/inventory'

interface CatBadgeProps {
  catId: CategoryId
  dense?: boolean
}

export function CatBadge({ catId, dense }: CatBadgeProps) {
  const c = CATEGORIES.find((x) => x.id === catId)
  if (!c) return null
  return (
    <span
      className="cat-badge"
      style={{
        background: catBg(c.hue),
        color: catFg(c.hue),
        borderColor: catBorder(c.hue),
      }}
    >
      <span className="cat-dot" style={{ background: catDot(c.hue) }} />
      {dense ? c.short : c.label}
    </span>
  )
}
