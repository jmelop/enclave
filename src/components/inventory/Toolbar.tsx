import { Input } from '@venator-ui/ui'
import { CATEGORIES, useInventoryStore } from '@/store/inventoryStore'
import { catDot } from '@/lib/utils'
import { catBg, catBorder } from '@/lib/utils'
import type { CategoryId, Density, ItemStatus, ViewMode } from '@/types/inventory'
import { useFilteredItems } from '@/store/inventoryStore'

const STATUS_OPTS: { value: ItemStatus | null; label: string }[] = [
  { value: null,  label: 'All' },
  { value: 'in',  label: 'IN'  },
  { value: 'low', label: 'LOW' },
  { value: 'out', label: 'OUT' },
]

const SORT_OPTS: { value: 'id' | 'name' | 'qty'; label: string }[] = [
  { value: 'id',   label: 'SKU'  },
  { value: 'name', label: 'NAME' },
  { value: 'qty',  label: 'QTY'  },
]

const DENSITY_OPTS: { value: Density; label: string }[] = [
  { value: 'compact', label: 'S' },
  { value: 'default', label: 'M' },
  { value: 'comfy',   label: 'L' },
]

export function Toolbar() {
  const search         = useInventoryStore((s) => s.search)
  const selectedCat    = useInventoryStore((s) => s.selectedCategory)
  const statusFilter   = useInventoryStore((s) => s.statusFilter)
  const sortBy         = useInventoryStore((s) => s.sortBy)
  const viewMode       = useInventoryStore((s) => s.viewMode)
  const density        = useInventoryStore((s) => s.density)
  const setSearch      = useInventoryStore((s) => s.setSearch)
  const setCategory    = useInventoryStore((s) => s.setCategory)
  const setStatusFilter = useInventoryStore((s) => s.setStatusFilter)
  const setSortBy      = useInventoryStore((s) => s.setSortBy)
  const setView        = useInventoryStore((s) => s.setView)
  const setDensity     = useInventoryStore((s) => s.setDensity)
  const filtered       = useFilteredItems()

  return (
    <div className="toolbar">
      <div className="tb-search">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search by name, model or location…"
          leftIcon={<span className="tb-prompt mono">$</span>}
          rightIcon={<span className="tb-search-meta mono">{filtered.length} match</span>}
        />
      </div>

      <div className="tb-row">
        <div className="chip-row">
          <button
            className={`chip ${selectedCat === null ? 'sel' : ''}`}
            onClick={() => setCategory(null)}
          >
            <span className="chip-dot" style={{ background: 'var(--fg-2)' }} />
            All
          </button>
          {CATEGORIES.map((c) => {
            const sel = selectedCat === c.id
            return (
              <button
                key={c.id}
                className={`chip ${sel ? 'sel' : ''}`}
                onClick={() => setCategory(sel ? null : (c.id as CategoryId))}
                style={
                  sel
                    ? { borderColor: catBorder(c.hue), background: catBg(c.hue) }
                    : {}
                }
              >
                <span className="chip-dot" style={{ background: catDot(c.hue) }} />
                {c.label}
              </button>
            )
          })}
        </div>

        <div className="tb-right">
          <div className="seg-mini">
            {STATUS_OPTS.map((s) => (
              <button
                key={String(s.value)}
                className={`seg-mini-opt ${statusFilter === s.value ? 'sel' : ''}`}
                onClick={() => setStatusFilter(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="seg-mini">
            {SORT_OPTS.map((s) => (
              <button
                key={s.value}
                className={`seg-mini-opt ${sortBy === s.value ? 'sel' : ''}`}
                onClick={() => setSortBy(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="seg-mini">
            {DENSITY_OPTS.map((d) => (
              <button
                key={d.value}
                className={`seg-mini-opt ${density === d.value ? 'sel' : ''}`}
                onClick={() => setDensity(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="seg-mini view-toggle">
            <button
              className={`seg-mini-opt ${viewMode === 'grid' ? 'sel' : ''}`}
              onClick={() => setView('grid' as ViewMode)}
              title="Grid"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="1" y="1" width="4" height="4" />
                <rect x="7" y="1" width="4" height="4" />
                <rect x="1" y="7" width="4" height="4" />
                <rect x="7" y="7" width="4" height="4" />
              </svg>
            </button>
            <button
              className={`seg-mini-opt ${viewMode === 'list' ? 'sel' : ''}`}
              onClick={() => setView('list' as ViewMode)}
              title="List"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="1" y="2" width="10" height="1.5" />
                <rect x="1" y="5.25" width="10" height="1.5" />
                <rect x="1" y="8.5" width="10" height="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
