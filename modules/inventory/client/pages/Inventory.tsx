import { useState, useEffect, useMemo } from 'react'
import { Button } from '@venator-ui/ui'
import { StatCards } from '@/components/inventory/StatCards'
import { Toolbar } from '@/components/inventory/Toolbar'
import { Catalog } from '@/components/inventory/Catalog'
import { DetailPanel } from '@/components/inventory/DetailPanel'
import { AddEditModal, blankDraft, type ItemDraft } from '@/components/inventory/AddEditModal'
import { useInventoryStore, useFilteredItems, useSelectedItem } from '@/store/inventoryStore'
import type { InventoryItem, ItemInput } from '@/types/inventory'

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
  const items        = useInventoryStore((s) => s.items)
  const viewMode     = useInventoryStore((s) => s.viewMode)
  const density      = useInventoryStore((s) => s.density)
  const hydrated     = useInventoryStore((s) => s.hydrated)
  const loading      = useInventoryStore((s) => s.loading)
  const error        = useInventoryStore((s) => s.error)
  const hydrate      = useInventoryStore((s) => s.hydrate)
  const refetch      = useInventoryStore((s) => s.refetch)
  const createItem   = useInventoryStore((s) => s.createItem)
  const updateItem   = useInventoryStore((s) => s.updateItem)
  const setSelectedId = useInventoryStore((s) => s.setSelectedId)
  const selectedId   = useInventoryStore((s) => s.selectedId)
  const selectedItem = useSelectedItem()  // live item derived from items[] — stays fresh after refetch

  const filtered = useFilteredItems()

  const [modal, setModal] = useState<ModalState | null>(null)
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    void hydrate()
  }, [hydrate])

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

  // 1-based display index for the selected item within the visible (filtered) list.
  // Matches the row number shown in Catalog — used only for SKU display, never for API ops.
  const displayIndex = useMemo(() => {
    if (!selectedId) return 0
    const idx = filtered.findIndex((i) => i.id === selectedId)
    return idx >= 0 ? idx + 1 : 0
  }, [filtered, selectedId])

  const openItem    = (it: InventoryItem) => setSelectedId(it.id)
  const closeDetail = () => setSelectedId(null)
  const openAdd    = () => setModal({ mode: 'add', draft: blankDraft() })
  const openEdit   = (it: InventoryItem) => setModal({ mode: 'edit', draft: toItemDraft(it) })
  const cancelModal = () => setModal(null)

  const saveModal = async () => {
    if (!modal) return
    const d = modal.draft
    const qty = Number(d.qty) || 0
    const input: ItemInput = {
      name: d.name.trim(),
      category: d.category,
      model: d.model,
      qty,
      location: d.location,
      notes: d.notes,
    }
    try {
      if (modal.mode === 'add') {
        await createItem(input)
      } else {
        await updateItem(d.id, input)
      }
      setModal(null)
    } catch (err) {
      console.error('[inventory] save error:', err)
    }
  }

  // ── 4 UI states ──────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return (
      <div className="canvas with-grid">
        <div className="v-topbar">
          <span className="crumb">enclave</span>
          <span className="sep">/</span>
          <span className="crumb active">inventory</span>
          <span className="spacer" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--fg-3)' }}>
          Loading inventory…
        </div>
      </div>
    )
  }

  if (error && !hydrated) {
    return (
      <div className="canvas with-grid">
        <div className="v-topbar">
          <span className="crumb">enclave</span>
          <span className="sep">/</span>
          <span className="crumb active">inventory</span>
          <span className="spacer" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '60vh' }}>
          <span style={{ color: 'var(--danger)' }}>Failed to load inventory: {error}</span>
          <Button variant="accent" size="sm" onClick={() => void refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="canvas with-grid">
        <div className="v-topbar">
          <span className="crumb">enclave</span>
          <span className="sep">/</span>
          <span className="crumb active">inventory</span>
          <span className="spacer" />
          <Button variant="accent" size="sm" onClick={openAdd}>+ Add Item</Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '60vh', color: 'var(--fg-3)' }}>
          <span>No items yet.</span>
          <Button variant="accent" size="sm" onClick={openAdd}>+ Add your first item</Button>
        </div>
        <AddEditModal
          open={!!modal}
          draft={modal?.draft ?? blankDraft()}
          isEdit={modal?.mode === 'edit'}
          onChange={(d) => setModal((m) => m ? { ...m, draft: d } : m)}
          onCancel={cancelModal}
          onSave={() => void saveModal()}
        />
      </div>
    )
  }

  // ── Normal list state ─────────────────────────────────────────────────────

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
          <span style={{ color: 'var(--fg-5)', fontFamily: 'monospace', fontSize: 12 }}>{time}</span>
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
        displayIndex={displayIndex}
        onClose={closeDetail}
        onEdit={(it) => { closeDetail(); openEdit(it) }}
      />

      <AddEditModal
        open={!!modal}
        draft={modal?.draft ?? blankDraft()}
        isEdit={modal?.mode === 'edit'}
        onChange={(d) => setModal((m) => m ? { ...m, draft: d } : m)}
        onCancel={cancelModal}
        onSave={() => void saveModal()}
      />
    </>
  )
}
