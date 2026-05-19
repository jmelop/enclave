import { useEffect } from 'react'
import { CatBadge } from '@/components/ui/CatBadge'
import { StatusPill } from '@/components/ui/StatusPill'
import { HistoryChart } from './HistoryChart'
import { CATEGORIES, useInventoryStore } from '@/store/inventoryStore'
import { catAccent } from '@/lib/utils'
import type { HistoryEntry, InventoryItem } from '@/types/inventory'

interface DetailPanelProps {
  item: InventoryItem | null
  history: HistoryEntry[] | null
  onClose: () => void
  onEdit: (item: InventoryItem) => void
}

export function DetailPanel({ item, history, onClose, onEdit }: DetailPanelProps) {
  const adjustQty = useInventoryStore((s) => s.adjustQty)
  const deleteItem = useInventoryStore((s) => s.deleteItem)

  const c = item ? CATEGORIES.find((x) => x.id === item.category) : null
  const accent = c ? catAccent(c.hue) : 'var(--fg)'

  useEffect(() => {
    if (!item) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [item, onClose])

  const handleDelete = (it: InventoryItem) => {
    deleteItem(it.id)
    onClose()
  }

  return (
    <>
      <div className={`scrim ${item ? 'open' : ''}`} onClick={onClose} />
      <aside className={`detail ${item ? 'open' : ''}`} aria-hidden={!item}>
        {item && (
          <>
            <header className="dt-head">
              <div className="dt-head-line">
                <span className="dt-idx">SKU #{item.id}</span>
                <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
              </div>
              <div className="dt-title-row">
                <CatBadge catId={item.category} />
                <StatusPill status={item.status} />
              </div>
              <h2 className="dt-title">{item.name}</h2>
              <div className="dt-model">{item.model}</div>
            </header>

            <section className="dt-section">
              <div className="dt-qty-block">
                <div className="dt-qty-label">QUANTITY</div>
                <div className="dt-qty-row">
                  <button className="qty-btn" onClick={() => adjustQty(item.id, -1)} aria-label="-1">−</button>
                  <div className="dt-qty-big" style={{ color: accent }}>{item.qty}</div>
                  <button className="qty-btn" onClick={() => adjustQty(item.id, +1)} aria-label="+1">+</button>
                </div>
                <div className="dt-qty-foot">units · last update {item.updated}</div>
              </div>
            </section>

            <section className="dt-section">
              <div className="dt-section-h"><span>·</span> SPECIFICATIONS</div>
              <dl className="dt-spec">
                <div><dt>Category</dt><dd><CatBadge catId={item.category} /></dd></div>
                <div><dt>Status</dt><dd><StatusPill status={item.status} /></dd></div>
                <div><dt>Model / Ref.</dt><dd className="mono">{item.model}</dd></div>
                <div><dt>Location</dt><dd className="mono">{item.location}</dd></div>
                <div><dt>Last update</dt><dd className="mono">{item.updated}</dd></div>
              </dl>
            </section>

            <section className="dt-section">
              <div className="dt-section-h"><span>·</span> NOTES</div>
              <div className="dt-notes">
                {item.notes || <span style={{ color: 'var(--fg-3)' }}>—</span>}
              </div>
            </section>

            <section className="dt-section">
              <div className="dt-section-h"><span>·</span> QUANTITY HISTORY</div>
              <HistoryChart history={history} accent={accent} />
            </section>

            <footer className="dt-foot">
              <button className="btn btn-ghost" onClick={() => handleDelete(item)}>
                <span className="btn-icon">⊗</span> Delete
              </button>
              <button className="btn btn-primary" onClick={() => onEdit(item)}>
                <span className="btn-icon">◈</span> Edit Item
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
