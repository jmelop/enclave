// Content-only component: topbar + hero + routing.
// No AppShell/EnclaveNav — used by both:
//   • standalone:  App.tsx wraps this with AppShell
//   • dashboard:   client.config.tsx routes expose this directly
import { useState, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Button } from '@venator-ui/ui'
import { IdeasPage }   from '@/pages/IdeasPage'
import { SnippetsPage } from '@/pages/SnippetsPage'
import { BoardPage }   from '@/pages/BoardPage'
import { TagsPage }    from '@/pages/TagsPage'
import { ArchivePage } from '@/pages/ArchivePage'
import { Panel }       from '@/components/lab/Panel'
import { useLabStore } from '@/store/labStore'

const SECTION_LABELS: Record<string, string> = {
  '':        'ideas',
  'snippets': 'snippets',
  'board':   'board',
  'tags':    'tags',
  'archive': 'archive',
}

export default function LabApp() {
  const [theme, setTheme] = useState<string>(
    () => document.documentElement.getAttribute('data-theme') ?? 'dark',
  )

  const openId    = useLabStore(s => s.openId)
  const ideas     = useLabStore(s => s.ideas)
  const setOpenId = useLabStore(s => s.setOpenId)
  const updateIdea = useLabStore(s => s.updateIdea)
  const newIdea   = useLabStore(s => s.newIdea)

  const location = useLocation()

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('enclave-theme', next)
      return next
    })
  }, [])

  const sectionLabel = (() => {
    const segments = location.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    if (!last || last === 'lab') return 'ideas'
    return SECTION_LABELS[last] ?? last
  })()

  const openIdea = ideas.find(i => i.id === openId) ?? null

  return (
    <>
      <div className="canvas with-grid">
        {/* v-topbar */}
        <div className="v-topbar">
          <span className="crumb">enclave</span>
          <span className="sep">/</span>
          <span className="crumb">lab</span>
          <span className="sep">/</span>
          <span className="crumb active">{sectionLabel}</span>
          <span className="v-cursor">▊</span>
          <span className="spacer" />
          <span className="pill">
            <span className="dot" />
            synced
          </span>
          <span style={{ color: 'var(--fg-5)' }}>·</span>
          <span>{new Date().toISOString().slice(0, 10)}</span>
          <span style={{ color: 'var(--fg-5)' }}>·</span>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
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
          <div className="hero-tag mono">// MODULE · enclave-lab</div>
          <div className="hero-row">
            <h1 className="hero-title">Lab<span className="hero-dot">.</span></h1>
            <div className="hero-actions">
              <Button variant="primary" size="sm" onClick={newIdea}>
                + New idea
              </Button>
            </div>
          </div>
          <div className="hero-sub">
            Capture ideas, attach code snippets, and track your R&D flow.
          </div>
        </header>

        <Routes>
          <Route index element={<IdeasPage onOpen={id => setOpenId(id)} />} />
          <Route path="snippets" element={<SnippetsPage onOpen={id => setOpenId(id)} />} />
          <Route path="board"    element={<BoardPage onOpen={id => setOpenId(id)} />} />
          <Route path="tags"     element={<TagsPage onOpen={id => setOpenId(id)} />} />
          <Route path="archive"  element={<ArchivePage onOpen={id => setOpenId(id)} />} />
          <Route path="*"        element={<IdeasPage onOpen={id => setOpenId(id)} />} />
        </Routes>
      </div>

      {/* Panel — always rendered, conditionally visible */}
      <Panel
        idea={openIdea}
        onClose={() => setOpenId(null)}
        onUpdate={updateIdea}
      />
    </>
  )
}
