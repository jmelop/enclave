import { ItemRow } from './ItemRow'
import { useInventoryStore } from '@/store/inventoryStore'
import type { Density, InventoryItem, SortKey } from '@/types/inventory'

interface CatalogListProps {
  items: InventoryItem[]
  density: Density
  onOpen: (item: InventoryItem) => void
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'id',       label: '#'        },
  { key: 'category', label: 'CAT'      },
  { key: 'name',     label: 'NAME'     },
  { key: 'model',    label: 'MODEL'    },
  { key: 'qty',      label: 'QTY'      },
  { key: 'status',   label: 'STATUS'   },
  { key: 'location', label: 'LOCATION' },
  { key: 'notes',    label: 'NOTES'    },
]

export function CatalogList({ items, density, onOpen }: CatalogListProps) {
  const sortBy    = useInventoryStore((s) => s.sortBy)
  const sortDir   = useInventoryStore((s) => s.sortDir)
  const setSortBy = useInventoryStore((s) => s.setSortBy)

  return (
    <div className={`catalog-list dense-${density}`}>
      <div className="list-head mono" role="row">
        {COLUMNS.map((col) => {
          const active = sortBy === col.key
          return (
            <button
              key={col.key}
              type="button"
              role="columnheader"
              aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              className={`inv-sort ${active ? 'active' : ''}`}
              onClick={() => setSortBy(col.key)}
              title={`Sort by ${col.label === '#' ? 'SKU' : col.label.toLowerCase()}`}
            >
              {col.label}
              <span className="inv-sort-arrow">{active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
            </button>
          )
        })}
        <span></span>
      </div>
      {items.map((item, idx) => (
        <ItemRow key={item.id} item={item} index={idx + 1} onOpen={onOpen} />
      ))}
    </div>
  )
}
