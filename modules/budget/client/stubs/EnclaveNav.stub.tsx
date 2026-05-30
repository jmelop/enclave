// Standalone-dev replacement for @enclave/ui-shell.
// The real EnclaveNav imports enclave.modules.client (the root registry),
// which pulls in every other module's source and causes @/ alias collisions.
// This stub renders only the budget module's nav — enough for local dev.
import { useLocation, useNavigate } from 'react-router-dom'

const NAV = [
  { label: 'Overview',   path: '/budget',            symbol: '◫' },
  { label: 'Expenses',   path: '/budget/expenses',   symbol: '↓' },
  { label: 'Recurring',  path: '/budget/recurring',  symbol: '↺' },
  { label: 'History',    path: '/budget/history',    symbol: '∿' },
  { label: 'Categories', path: '/budget/categories', symbol: '◒' },
]

export function EnclaveNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <aside className="sidebar">
      <div className="brand">
        <div
          className="brand-mark"
          style={{
            background: 'linear-gradient(135deg, #fcd34d, #f97316)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            boxShadow: 'none',
          }}
        >
          E
        </div>
        <div>
          <div className="brand-name" style={{ fontSize: 13 }}>enclave</div>
          <div className="brand-sub">budget</div>
        </div>
      </div>
      <div className="side-section">
        <div className="side-section-h">MENU</div>
        <div className="side-nav">
          {NAV.map(n => {
            const active = n.path === '/budget'
              ? pathname === '/budget'
              : pathname.startsWith(n.path)
            return (
              <button
                key={n.path}
                className={`side-link${active ? ' active' : ''}`}
                onClick={() => navigate(n.path)}
              >
                <span className="side-icon">{n.symbol}</span>
                {n.label}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
