// Standalone-dev replacement for @enclave/ui-shell.
// Prevents the cascading import chain that causes @/ alias collisions.
import { useLocation, useNavigate } from 'react-router-dom'

const NAV = [
  { label: 'Portfolio', path: '/portfolio', symbol: '◈' },
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
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: 'none',
          }}
        >
          E
        </div>
        <div>
          <div className="brand-name" style={{ fontSize: 13 }}>enclave</div>
          <div className="brand-sub">portfolio</div>
        </div>
      </div>
      <div className="side-section">
        <div className="side-nav">
          {NAV.map(n => (
            <button
              key={n.path}
              className={`side-link${pathname === n.path ? ' active' : ''}`}
              onClick={() => navigate(n.path)}
            >
              <span className="side-icon">{n.symbol}</span>
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
