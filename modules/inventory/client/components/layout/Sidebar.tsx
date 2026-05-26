import { CATEGORIES } from '@/store/inventoryStore'
import { catDot } from '@/lib/utils'
import { useInventoryStore } from '@/store/inventoryStore'

const NAV = [
  { k: 'inventory', label: 'Inventory', icon: '⬛', active: true,  count: '' },
  { k: 'projects',  label: 'Projects',  icon: '◆', active: false, count: '7' },
  { k: 'builds',    label: 'Builds',    icon: '◇', active: false, count: '3' },
  { k: 'notes',     label: 'Notes',     icon: '⊡', active: false, count: '48' },
  { k: 'feeds',     label: 'Feeds',     icon: '◈', active: false, count: '12' },
  { k: 'snippets',  label: 'Snippets',  icon: '⊯', active: false, count: '31' },
]

export function Sidebar() {
  const totalItems = useInventoryStore((s) => s.items.length)

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">⌘</div>
        <div>
          <div className="brand-name">enclave</div>
          <div className="brand-sub">personal lab</div>
        </div>
      </div>

      <div className="side-section">
        <div className="side-section-h">/ MODULES</div>
        <nav className="side-nav">
          {NAV.map((n) => (
            <button
              key={n.k}
              className={`side-link ${n.active ? 'active' : ''}`}
              onClick={(e) => e.preventDefault()}
            >
              <span className="side-icon">{n.icon}</span>
              <span className="side-label">{n.label}</span>
              <span className="side-count mono">{n.k === 'inventory' ? totalItems : n.count}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="side-section">
        <div className="side-section-h">/ INVENTORY</div>
        <nav className="side-nav">
          {CATEGORIES.map((c) => (
            <button key={c.id} className="side-link sub" onClick={(e) => e.preventDefault()}>
              <span className="side-icon" style={{ color: catDot(c.hue) }}>◆</span>
              <span className="side-label">{c.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="side-foot">
        <div className="user-line">
          <span className="user-av">vh</span>
          <div>
            <div className="user-name">veh@enclave</div>
            <div className="user-sub mono">v0.1.0 · synced</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
