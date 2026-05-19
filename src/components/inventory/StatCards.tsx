import { useInventoryStore } from '@/store/inventoryStore'
import { CATEGORIES } from '@/store/inventoryStore'

export function StatCards() {
  const items = useInventoryStore((s) => s.items)

  const total      = items.length
  const cats       = new Set(items.map((i) => i.category)).size
  const lowCount   = items.filter((i) => i.status === 'low').length
  const outCount   = items.filter((i) => i.status === 'out').length
  const totalUnits = items.reduce((s, i) => s + (i.qty || 0), 0)

  const cards = [
    { idx: '01', label: 'TOTAL ITEMS',       value: total,    sub: `${totalUnits} units across all categories`, accent: undefined },
    { idx: '02', label: 'ACTIVE CATEGORIES', value: cats,     sub: `of ${CATEGORIES.length} available · all populated`, accent: undefined },
    { idx: '03', label: 'LOW STOCK',         value: lowCount, sub: 'needs reorder soon', accent: 'var(--warn)' },
    { idx: '04', label: 'OUT OF STOCK',      value: outCount, sub: 'quantity = 0 · action required', accent: 'var(--danger)' },
  ]

  return (
    <div className="stats">
      {cards.map((c) => (
        <div key={c.idx} className="stat-card">
          <div className="stat-head">
            <span className="stat-idx">{c.idx}</span>
            <span className="stat-label">{c.label}</span>
          </div>
          <div className="stat-value">
            <span style={{ color: c.accent ?? 'var(--fg)' }}>{c.value}</span>
          </div>
          <div className="stat-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
