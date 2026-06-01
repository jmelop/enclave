import { useState, useCallback } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@venator-ui/ui'
import { Plus } from 'lucide-react'
import { CreateModal } from '@/components/strategy/CreateModal'
import { LoopPage }     from '@/pages/LoopPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { GoalsPage }    from '@/pages/GoalsPage'
import { PlansPage }    from '@/pages/PlansPage'
import { ResultsPage }  from '@/pages/ResultsPage'
import { IntelPage }    from '@/pages/IntelPage'

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

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('enclave-theme', next)
      return next
    })
  }, [])

  type ModalType = 'goal' | 'plan' | 'retro' | 'intel'
  const [modal, setModal] = useState<ModalType | null>(null)

  const NEW_BTN: Record<string, { label: string; type: ModalType }> = {
    '':        { label: 'New goal',   type: 'goal'  },
    'loop':    { label: 'New goal',   type: 'goal'  },
    'overview':{ label: 'New goal',   type: 'goal'  },
    'goals':   { label: 'New goal',   type: 'goal'  },
    'plans':   { label: 'New plan',   type: 'plan'  },
    'results': { label: 'New result', type: 'retro' },
    'intel':   { label: 'New intel',  type: 'intel' },
  }

  const sectionLabel = (() => {
    const segs = location.pathname.split('/').filter(Boolean)
    const last = segs[segs.length - 1]
    if (!last || last === 'strategy') return 'loop'
    return SECTION_LABELS[last] ?? last
  })()

  // Navigate helper used by pages (maps view names to URLs)
  const goTo = useCallback((view: string, goalId?: string) => {
    const base = '/strategy'
    if (view === '' || view === 'loop') navigate(base)
    else if (view === 'goals' && goalId) navigate(`${base}/goals?goal=${goalId}`)
    else navigate(`${base}/${view}`)
  }, [navigate])

  const goalId = new URLSearchParams(location.search).get('goal') ?? undefined

  return (
    <>
      <div className="canvas with-grid">
        {/* v-topbar */}
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

        {/* page hero */}
        <header className="hero">
          <div className="hero-tag mono">// MODULE · enclave-strategy</div>
          <div className="hero-row">
            <h1 className="hero-title">Strategy<span className="hero-dot">.</span></h1>
            <div className="hero-actions">
              <Button variant="primary" size="sm" onClick={() => setModal(NEW_BTN[sectionLabel]?.type ?? 'goal')}>
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
          <Route path="goals"    element={<GoalsPage goalId={goalId} onNavigate={goTo} />} />
          <Route path="plans"    element={<PlansPage onNavigate={goTo} />} />
          <Route path="results"  element={<ResultsPage onNavigate={goTo} />} />
          <Route path="intel"    element={<IntelPage onNavigate={goTo} />} />
        </Routes>
      </div>

      {modal && (
        <CreateModal
          type={modal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
