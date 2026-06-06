import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@venator-ui/ui'
import { Plus } from 'lucide-react'
import { CreateModal, type ModalType, type StrategyPrefill } from '@/components/strategy/CreateModal'
import { LoopPage }     from '@/pages/LoopPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { GoalsPage }    from '@/pages/GoalsPage'
import { PlansPage }    from '@/pages/PlansPage'
import { ResultsPage }  from '@/pages/ResultsPage'
import { IntelPage }    from '@/pages/IntelPage'
import { useStrategyStore } from '@/store/strategyStore'

const SECTION_LABELS: Record<string, string> = {
  '': 'loop', 'overview': 'overview', 'goals': 'goals',
  'plans': 'plans', 'results': 'results', 'intel': 'intel',
}

export default function StrategyApp() {
  const [theme, setTheme] = useState<string>(
    () => document.documentElement.getAttribute('data-theme') ?? 'dark',
  )
  const location = useLocation()
  const navigate = useNavigate()

  const hydrate  = useStrategyStore(s => s.hydrate)
  const refetch  = useStrategyStore(s => s.refetch)
  const loading  = useStrategyStore(s => s.loading)
  const error    = useStrategyStore(s => s.error)
  const hydrated = useStrategyStore(s => s.hydrated)

  useEffect(() => { void hydrate() }, [hydrate])

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('enclave-theme', next)
      return next
    })
  }, [])

  interface ModalState { type: ModalType; editId?: string; prefill?: StrategyPrefill }
  const [modal, setModal] = useState<ModalState | null>(null)

  const handleEdit = useCallback((type: ModalType, id: string, prefill: StrategyPrefill) => {
    setModal({ type, editId: id, prefill })
  }, [])

  const NEW_BTN: Record<string, { label: string; type: ModalType }> = {
    '':        { label: 'New goal',   type: 'goal'   },
    'loop':    { label: 'New goal',   type: 'goal'   },
    'overview':{ label: 'New goal',   type: 'goal'   },
    'goals':   { label: 'New goal',   type: 'goal'   },
    'plans':   { label: 'New plan',   type: 'plan'   },
    'results': { label: 'New result', type: 'result' },
    'intel':   { label: 'New intel',  type: 'intel'  },
  }

  const sectionLabel = (() => {
    const segs = location.pathname.split('/').filter(Boolean)
    const last = segs[segs.length - 1]
    if (!last || last === 'strategy') return 'loop'
    return SECTION_LABELS[last] ?? last
  })()

  const goTo = useCallback((view: string, goalId?: string) => {
    const base = '/strategy'
    if (view === '' || view === 'loop') navigate(base)
    else if (view === 'goals' && goalId) navigate(`${base}/goals?goal=${goalId}`)
    else navigate(`${base}/${view}`)
  }, [navigate])

  const goalId = new URLSearchParams(location.search).get('goal') ?? undefined

  const topbar = (
    <div className="v-topbar">
      <span className="crumb">enclave</span>
      <span className="sep">/</span>
      <span className="crumb">strategy</span>
      <span className="sep">/</span>
      <span className="crumb active">{sectionLabel}</span>
      <span className="v-cursor">▊</span>
      <span className="spacer" />
      <span className="pill"><span className="dot" />synced</span>
      <span style={{ color: 'var(--fg-5)' }}>·</span>
      <span>{new Date().toISOString().slice(0, 10)}</span>
      <span style={{ color: 'var(--fg-5)' }}>·</span>
      <button
        onClick={toggleTheme}
        style={{ appearance: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', display: 'flex', alignItems: 'center', padding: 0 }}
      >
        {theme === 'dark' ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="3.5" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M11.8 3.2l-1 1M4.2 11.8l-1 1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z" />
          </svg>
        )}
      </button>
    </div>
  )

  // ── 4 UI states ───────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return (
      <div className="canvas with-grid">
        {topbar}
        <header className="hero">
          <div className="hero-tag mono">// MODULE · enclave-strategy</div>
          <div className="hero-row">
            <h1 className="hero-title">Strategy<span className="hero-dot">.</span></h1>
          </div>
        </header>
        <div style={{ display: 'grid', placeItems: 'center', height: 240, color: 'var(--fg-4)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
          Loading…
        </div>
      </div>
    )
  }

  if (error && !hydrated) {
    return (
      <div className="canvas with-grid">
        {topbar}
        <header className="hero">
          <div className="hero-tag mono">// MODULE · enclave-strategy</div>
          <div className="hero-row">
            <h1 className="hero-title">Strategy<span className="hero-dot">.</span></h1>
          </div>
        </header>
        <div style={{ display: 'grid', placeItems: 'center', height: 240 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="mono" style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>
            <button className="btn btn-ghost" onClick={() => void refetch()}>Retry</button>
          </div>
        </div>
      </div>
    )
  }

  // ── normal + empty (hydrated) ─────────────────────────────────────────────

  return (
    <>
      <div className="canvas with-grid">
        {topbar}

        <header className="hero">
          <div className="hero-tag mono">// MODULE · enclave-strategy</div>
          <div className="hero-row">
            <h1 className="hero-title">Strategy<span className="hero-dot">.</span></h1>
            <div className="hero-actions">
              <Button variant="primary" size="sm" onClick={() => setModal({ type: NEW_BTN[sectionLabel]?.type ?? 'goal' })}>
                <Plus size={15} /> {NEW_BTN[sectionLabel]?.label ?? 'New goal'}
              </Button>
            </div>
          </div>
          <div className="hero-sub">
            Track your goals, plans, results and intel in one loop.
          </div>
        </header>

        <Routes>
          <Route index element={<LoopPage onNavigate={goTo} />} />
          <Route path="overview" element={<OverviewPage onNavigate={goTo} />} />
          <Route path="goals"    element={<GoalsPage goalId={goalId} onNavigate={goTo} onEdit={handleEdit} />} />
          <Route path="plans"    element={<PlansPage onNavigate={goTo} onEdit={handleEdit} />} />
          <Route path="results"  element={<ResultsPage onNavigate={goTo} onEdit={handleEdit} />} />
          <Route path="intel"    element={<IntelPage onNavigate={goTo} onEdit={handleEdit} />} />
        </Routes>
      </div>

      {modal && (
        <CreateModal
          type={modal.type}
          editId={modal.editId}
          prefill={modal.prefill}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
