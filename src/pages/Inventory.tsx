import { useState } from 'react'
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
        <header className="hero">
          <div className="hero-tag mono">// MODULE · enclave-inventory</div>
          <div className="hero-row">
            <h1 className="hero-title">
              Inventory<span className="hero-dot">.</span>
            </h1>
            <div className="hero-actions">
              <button className="btn btn-ghost">
                <span className="btn-icon">↑</span> Export
              </button>
              <button className="btn btn-primary" onClick={openAdd}>
                <span className="btn-icon">+</span> Add Item
              </button>
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
