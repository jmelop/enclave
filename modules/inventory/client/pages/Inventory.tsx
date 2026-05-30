import { useState, useEffect } from 'react'
import { Button } from '@venator-ui/ui'
import { StatCards } from '@/components/inventory/StatCards'
import { Toolbar } from '@/components/inventory/Toolbar'
import { Catalog } from '@/components/inventory/Catalog'
import { DetailPanel } from '@/components/inventory/DetailPanel'
import { AddEditModal, blankDraft, type ItemDraft } from '@/components/inventory/AddEditModal'
import { useInventoryStore, useFilteredItems } from '@/store/inventoryStore'
import { deriveStatus, today } from '@/lib/utils'
import type { InventoryItem } from '@/types/inventory'

interface ModalState {
  mode: 'add' | 'edit'
  draft: ItemDraft
}

function formatTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function toItemDraft(item: InventoryItem): ItemDraft {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    model: item.model,
    qty: item.qty,
    status: item.status,
    location: item.location,
    notes: item.notes,
  }
}

export function InventoryPage() {
  const items      = useInventoryStore((s) => s.items)
  const history    = useInventoryStore((s) => s.history)
  const viewMode   = useInventoryStore((s) => s.viewMode)
  const density    = useInventoryStore((s) => s.density)
  const addItem    = useInventoryStore((s) => s.addItem)
  const updateItem = useInventoryStore((s) => s.updateItem)
  const setSelected = useInventoryStore((s) => s.setSelectedItem)
  const selectedItem = useInventoryStore((s) => s.selectedItem)

  const filtered = useFilteredItems()

  const [modal, setModal] = useState<ModalState | null>(null)
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  const lowCount = items.filter((i) => i.status === 'low').length
  const outCount = items.filter((i) => i.status === 'out').length
  const hasAlerts = lowCount + outCount > 0

  const [theme, setTheme] = useState<string>(() =>
    document.documentElement.getAttribute('data-theme') ?? 'dark'
  )
  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('enclave-theme', next)
      return next
    })
  }

  const openItem = (it: InventoryItem) => setSelected(it)
  const closeDetail = () => setSelected(null)

  const openAdd = () => setModal({ mode: 'add', draft: blankDraft() })
  const openEdit = (it: InventoryItem) => setModal({ mode: 'edit', draft: toItemDraft(it) })
  const cancelModal = () => setModal(null)

  const saveModal = () => {
    if (!modal) return
    const d = modal.draft
    const qty = Number(d.qty) || 0
    const status = qty === 0 ? 'out' as const : (d.status || deriveStatus(qty))

    if (modal.mode === 'add') {
      addItem({ name: d.name, category: d.category, model: d.model, qty, location: d.location, notes: d.notes })
    } else {
      updateItem({
        id: d.id,
        name: d.name,
        category: d.category,
        model: d.model,
        qty,
        status,
        location: d.location,
        notes: d.notes,
        updated: today(),
      })
    }
    setModal(null)
  }

  return (
    <>
      <div className="canvas with-grid">
        <div className="v-topbar">
          <span className="crumb">enclave</span>
          <span className="sep">/</span>
          <span className="crumb active">inventory</span>
          <span className="v-cursor">▊</span>
          <span className="spacer" />
          {hasAlerts && (
            <span className="alert-strip">
              <span>⚠</span>
              {outCount > 0 && <span className="alert-seg-out">{outCount} OUT</span>}
              {outCount > 0 && lowCount > 0 && <span className="alert-sep">·</span>}
              {lowCount > 0 && <span className="alert-seg-low">{lowCount} LOW</span>}
            </span>
          )}
          <span className="pill"><span className="dot" />synced</span>
          <span style={{ color: 'var(--fg-5)' }}>·</span>
          <span>{new Date().toISOString().slice(0, 10)}</span>
          <span style={{ color: 'var(--fg-5)' }}>·</span>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ appearance: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="3.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M11.8 3.2l-1 1M4.2 11.8l-1 1"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z"/>
              </svg>
            )}
          </button>
        </div>
        <header className="hero">
          <div className="hero-tag mono">// MODULE · enclave-inventory</div>
          <div className="hero-row">
            <h1 className="hero-title">
              Inventory<span className="hero-dot">.</span>
            </h1>
            <div className="hero-actions">
              <Button variant="ghost" size="sm">↑ Export</Button>
              <Button variant="accent" size="sm" onClick={openAdd}>+ Add Item</Button>
            </div>
          </div>
          <div className="hero-sub">
            A technical catalog of every component, board and tool on the bench.
            Search by reference, filter by category, track stock.
          </div>
        </header>

        <StatCards />

        <Toolbar />

        <Catalog
          items={filtered}
          viewMode={viewMode}
          density={density}
          onOpen={openItem}
        />

        <footer className="page-foot mono">
          <span>END · {filtered.length} / {items.length} entries</span>
          <span className="dim">enclave/inventory · build 2026.05</span>
        </footer>
      </div>

      <DetailPanel
        item={selectedItem}
        history={selectedItem ? (history[selectedItem.id] ?? null) : null}
        onClose={closeDetail}
        onEdit={(it) => { closeDetail(); openEdit(it) }}
      />

      <AddEditModal
        open={!!modal}
        draft={modal?.draft ?? blankDraft()}
        isEdit={modal?.mode === 'edit'}
        onChange={(d) => setModal((m) => m ? { ...m, draft: d } : m)}
        onCancel={cancelModal}
        onSave={saveModal}
      />
    </>
  )
}
