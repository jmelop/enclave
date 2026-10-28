// Content-only component: topbar + hero + routing.
//   • standalone: App.tsx wraps it with the sidebar shell
//   • dashboard:  client.config.tsx routes expose this directly
import { useEffect, useMemo, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Button } from '@venator-ui/ui'
import { InventoryPage } from '@/pages/Inventory'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { AddEditModal, blankDraft, type ItemDraft } from '@/components/inventory/AddEditModal'
import { CategoryModal } from '@/components/inventory/CategoryModal'
import { DetailPanel } from '@/components/inventory/DetailPanel'
import { useFilteredItems, useInventoryStore, useSelectedItem } from '@/store/inventoryStore'
import { parsePrice } from '@/lib/utils'
import type { Category, CategoryInput, InventoryItem, ItemInput } from '@/types/inventory'

type Section = 'items' | 'categories'

const HERO: Record<Section, { label: string; sub: string }> = {
  items: {
    label: 'Add Item',
    sub:   'A technical catalog of every component, board and tool on the bench. Search by reference, filter by category, track stock.',
  },
  categories: {
    label: 'Add category',
    sub:   'Shape the catalog your way: create, rename and recolor the categories items are filed under.',
  },
}

interface ItemModalState {
  mode: 'add' | 'edit'
  draft: ItemDraft
}

// Edit carries the source category; add starts blank.
type CategoryModalState = { mode: 'add' } | { mode: 'edit'; category: Category } | null

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
    location: item.location,
    notes: item.notes,
    price: item.price == null ? '' : String(item.price),
  }
}

export default function InventoryApp() {
  const location       = useLocation()
  const items          = useInventoryStore((s) => s.items)
  const hydrated       = useInventoryStore((s) => s.hydrated)
  const loading        = useInventoryStore((s) => s.loading)
  const error          = useInventoryStore((s) => s.error)
  const hydrate        = useInventoryStore((s) => s.hydrate)
  const refetch        = useInventoryStore((s) => s.refetch)
  const createItem     = useInventoryStore((s) => s.createItem)
  const updateItem     = useInventoryStore((s) => s.updateItem)
  const createCategory = useInventoryStore((s) => s.createCategory)
  const updateCategory = useInventoryStore((s) => s.updateCategory)
  const selectedId     = useInventoryStore((s) => s.selectedId)
  const setSelectedId  = useInventoryStore((s) => s.setSelectedId)
  const selectedItem   = useSelectedItem()  // live item derived from items[] — stays fresh after refetch
  const filtered       = useFilteredItems()

  const [itemModal, setItemModal]   = useState<ItemModalState | null>(null)
  const [catModal, setCatModal]     = useState<CategoryModalState>(null)
  const [catError, setCatError]     = useState<string | null>(null)
  const [time, setTime]             = useState(() => formatTime(new Date()))
  const [theme, setTheme]           = useState<string>(() =>
    document.documentElement.getAttribute('data-theme') ?? 'dark'
  )

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('enclave-theme', next)
      return next
    })
  }

  const section: Section = location.pathname.split('/').filter(Boolean).pop() === 'categories' ? 'categories' : 'items'
  const hero = HERO[section]

  // 1-based display index for the selected item within the visible (filtered) list.
  // Matches the row number shown in Catalog — used only for SKU display, never for API ops.
  const displayIndex = useMemo(() => {
    if (!selectedId) return 0
    const idx = filtered.findIndex((i) => i.id === selectedId)
    return idx >= 0 ? idx + 1 : 0
  }, [filtered, selectedId])

  const closeDetail = () => setSelectedId(null)

  // Leaving the items section drops the selection so the panel doesn't reopen on return.
  useEffect(() => {
    if (section !== 'items') setSelectedId(null)
  }, [section, setSelectedId])

  const lowCount  = items.filter((i) => i.status === 'low').length
  const outCount  = items.filter((i) => i.status === 'out').length
  const hasAlerts = hydrated && lowCount + outCount > 0

  const openAddItem  = () => setItemModal({ mode: 'add', draft: blankDraft() })
  const openEditItem = (it: InventoryItem) => setItemModal({ mode: 'edit', draft: toItemDraft(it) })
  const openAddCat   = () => { setCatError(null); setCatModal({ mode: 'add' }) }
  const openEditCat  = (c: Category) => { setCatError(null); setCatModal({ mode: 'edit', category: c }) }

  const handleHeroBtn = () => (section === 'categories' ? openAddCat() : openAddItem())

  const saveItem = async () => {
    if (!itemModal) return
    const d = itemModal.draft
    const input: ItemInput = {
      name: d.name.trim(),
      category: d.category,
      model: d.model,
      qty: Number(d.qty) || 0,
      location: d.location,
      notes: d.notes,
      price: parsePrice(d.price) ?? null,
    }
    try {
      if (itemModal.mode === 'add') await createItem(input)
      else await updateItem(d.id, input)
      setItemModal(null)
    } catch (err) {
      console.error('[inventory] save error:', err)
    }
  }

  const saveCategory = async (input: CategoryInput) => {
    if (!catModal) return
    setCatError(null)
    try {
      if (catModal.mode === 'edit') await updateCategory(catModal.category.id, input)
      else await createCategory(input)
      setCatModal(null)
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Failed to save category')
    }
  }

  const renderBody = () => {
    if (loading && !hydrated) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>
          Loading inventory…
        </div>
      )
    }
    if (error && !hydrated) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
          <span style={{ color: 'var(--danger)' }}>Failed to load inventory: {error}</span>
          <Button variant="accent" size="sm" onClick={() => void refetch()}>Retry</Button>
        </div>
      )
    }
    return (
      <Routes>
        <Route index element={<InventoryPage onAdd={openAddItem} />} />
        <Route path="categories" element={<CategoriesPage onEdit={openEditCat} />} />
        <Route path="*" element={<InventoryPage onAdd={openAddItem} />} />
      </Routes>
    )
  }

  return (
    <>
      <div className="canvas with-grid">
        <div className="v-topbar">
          <span className="crumb">enclave</span>
          <span className="sep">/</span>
          <span className="crumb">inventory</span>
          <span className="sep">/</span>
          <span className="crumb active">{section}</span>
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
              {section === 'items' && <button type="button" className="inv-btn inv-btn-ghost">↑ Export</button>}
              <button type="button" className="inv-btn inv-btn-primary" onClick={handleHeroBtn}>+ {hero.label}</button>
            </div>
          </div>
          <div className="hero-sub">{hero.sub}</div>
        </header>

        {renderBody()}
      </div>

      {/* Outside .canvas: every module's `.canvas > * { position: relative }` would break its fixed positioning */}
      <DetailPanel
        item={section === 'items' ? selectedItem : null}
        displayIndex={displayIndex}
        onClose={closeDetail}
        onEdit={(it) => { closeDetail(); openEditItem(it) }}
      />

      <AddEditModal
        open={!!itemModal}
        draft={itemModal?.draft ?? blankDraft()}
        isEdit={itemModal?.mode === 'edit'}
        onChange={(d) => setItemModal((m) => m ? { ...m, draft: d } : m)}
        onCancel={() => setItemModal(null)}
        onSave={() => void saveItem()}
      />

      <CategoryModal
        open={!!catModal}
        initial={catModal?.mode === 'edit' ? catModal.category : undefined}
        error={catError}
        onClose={() => setCatModal(null)}
        onSave={(input) => void saveCategory(input)}
      />
    </>
  )
}
