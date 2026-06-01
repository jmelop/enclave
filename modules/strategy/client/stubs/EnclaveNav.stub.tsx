// Standalone-dev replacement for @enclave/ui-shell.
// The real EnclaveNav imports enclave.modules.client (the root registry),
// which pulls in every other module's source and causes @/ alias collisions.
// This stub renders only the strategy module's nav — enough for local dev.
import { useLocation, useNavigate } from 'react-router-dom'

const NAV = [
  { label: 'Loop',     path: '/strategy',          symbol: '↺' },
  { label: 'Overview', path: '/strategy/overview', symbol: '◫' },
  { label: 'Goals',    path: '/strategy/goals',    symbol: '◎' },
  { label: 'Plans',    path: '/strategy/plans',    symbol: '☑' },
  { label: 'Results',  path: '/strategy/results',  symbol: '∿' },
  { label: 'Intel',    path: '/strategy/intel',    symbol: '⚗' },
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
            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
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
          <div className="brand-sub">strategy</div>
        </div>
      </div>
      <div className="side-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 8px 6px', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #d97706)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-2)' }}>Strategy</span>
        </div>
        <div className="side-nav">
          {NAV.map(n => {
            const active = n.path === '/strategy'
              ? pathname === '/strategy'
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
