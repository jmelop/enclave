import { useMemo } from 'react'
import { Button } from '@venator-ui/ui'
import { StatCards } from '@/components/inventory/StatCards'
import { Toolbar } from '@/components/inventory/Toolbar'
import { Catalog } from '@/components/inventory/Catalog'
import { DetailPanel } from '@/components/inventory/DetailPanel'
import { useInventoryStore, useFilteredItems, useSelectedItem } from '@/store/inventoryStore'
import type { InventoryItem } from '@/types/inventory'

interface InventoryPageProps {
  onAdd: () => void
  onEdit: (item: InventoryItem) => void
}

export function InventoryPage({ onAdd, onEdit }: InventoryPageProps) {
  const items        = useInventoryStore((s) => s.items)
  const viewMode     = useInventoryStore((s) => s.viewMode)
  const density      = useInventoryStore((s) => s.density)
  const setSelectedId = useInventoryStore((s) => s.setSelectedId)
  const selectedId   = useInventoryStore((s) => s.selectedId)
  const selectedItem = useSelectedItem()  // live item derived from items[] — stays fresh after refetch

  const filtered = useFilteredItems()

  // 1-based display index for the selected item within the visible (filtered) list.
  // Matches the row number shown in Catalog — used only for SKU display, never for API ops.
  const displayIndex = useMemo(() => {
    if (!selectedId) return 0
    const idx = filtered.findIndex((i) => i.id === selectedId)
    return idx >= 0 ? idx + 1 : 0
  }, [filtered, selectedId])

  const openItem    = (it: InventoryItem) => setSelectedId(it.id)
  const closeDetail = () => setSelectedId(null)

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh', color: 'var(--fg-3)' }}>
        <span>No items yet.</span>
        <Button variant="accent" size="sm" onClick={onAdd}>+ Add your first item</Button>
      </div>
    )
  }

  return (
    <>
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

      <DetailPanel
        item={selectedItem}
        displayIndex={displayIndex}
        onClose={closeDetail}
        onEdit={(it) => { closeDetail(); onEdit(it) }}
      />
    </>
  )
}
