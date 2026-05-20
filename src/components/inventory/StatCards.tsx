import { StatCard } from '@venator-ui/patterns'
import { useInventoryStore, CATEGORIES } from '@/store/inventoryStore'

export function StatCards() {
  const items = useInventoryStore((s) => s.items)

  const total      = items.length
  const cats       = new Set(items.map((i) => i.category)).size
  const lowCount   = items.filter((i) => i.status === 'low').length
  const outCount   = items.filter((i) => i.status === 'out').length
  const totalUnits = items.reduce((s, i) => s + (i.qty || 0), 0)

  return (
    <div className="stats">
      <StatCard title="Total Items"       value={total}    description={`${totalUnits} units across all categories`} />
      <StatCard title="Active Categories" value={cats}     description={`of ${CATEGORIES.length} available · all populated`} />
      <StatCard title="Low Stock"         value={lowCount} description="needs reorder soon"              variant="warning" />
      <StatCard title="Out of Stock"      value={outCount} description="quantity = 0 · action required"  variant="error" />
    </div>
  )
}
