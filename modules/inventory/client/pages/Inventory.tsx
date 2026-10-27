import { Button } from '@venator-ui/ui'
import { StatCards } from '@/components/inventory/StatCards'
import { Toolbar } from '@/components/inventory/Toolbar'
import { Catalog } from '@/components/inventory/Catalog'
import { useInventoryStore, useFilteredItems } from '@/store/inventoryStore'
import type { InventoryItem } from '@/types/inventory'

interface InventoryPageProps {
  onAdd: () => void
}

export function InventoryPage({ onAdd }: InventoryPageProps) {
  const items        = useInventoryStore((s) => s.items)
  const viewMode     = useInventoryStore((s) => s.viewMode)
  const density      = useInventoryStore((s) => s.density)
  const setSelectedId = useInventoryStore((s) => s.setSelectedId)

  const filtered = useFilteredItems()

  const openItem = (it: InventoryItem) => setSelectedId(it.id)

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
    </>
  )
}
