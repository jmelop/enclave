import { useEffect, useState } from 'react'
import { Button, Input } from '@venator-ui/ui'
import { useLabStore } from '@/store/labStore'
import { LANG_META } from '@/lib/utils'
import { SnippetView } from '@/components/lab/SnippetView'
import type { Lang } from '@/types/lab'

interface SnippetsPageProps {
  onOpen: (id: string) => void
}

type LangFilter = Lang | 'all'

const ALL_LANGS = Object.keys(LANG_META) as Lang[]

export function SnippetsPage({ onOpen }: SnippetsPageProps) {
  const allSnippets      = useLabStore(s => s.allSnippets)
  const snippetsLoading  = useLabStore(s => s.snippetsLoading)
  const snippetsError    = useLabStore(s => s.snippetsError)
  const snippetsHydrated = useLabStore(s => s.snippetsHydrated)
  const hydrateSnippets  = useLabStore(s => s.hydrateSnippets)
  const refetchSnippets  = useLabStore(s => s.refetchSnippets)

  const [query, setQuery] = useState('')
  const [langFilter, setLangFilter] = useState<LangFilter>('all')

  useEffect(() => { void hydrateSnippets() }, [hydrateSnippets])

  // ── 4 UI states ────────────────────────────────────────────────────────────

  if (snippetsLoading && !snippetsHydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>
        Loading snippets…
      </div>
    )
  }

  if (snippetsError && !snippetsHydrated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
        <span style={{ color: 'var(--danger)' }}>Failed to load snippets: {snippetsError}</span>
        <Button variant="accent" size="sm" onClick={() => void refetchSnippets()}>Retry</Button>
      </div>
    )
  }

  if (snippetsHydrated && allSnippets.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">{'</>'}</div>
        <div className="empty-state-text">Add snippets to your ideas to see them here.</div>
      </div>
    )
  }

  // ── Normal list state ──────────────────────────────────────────────────────

  const filtered = allSnippets.filter(snip => {
    if (langFilter !== 'all' && snip.lang !== langFilter) return false
    if (query) {
      const q = query.toLowerCase()
      return (
        snip.title.toLowerCase().includes(q) ||
        (snip.desc?.toLowerCase().includes(q) ?? false) ||
        (snip.tags?.some(t => t.toLowerCase().includes(q)) ?? false)
      )
    }
    return true
  })

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search snippets..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          }
          style={{ width: 280 }}
        />
      </div>

      {/* Lang filter pills */}
      <div className="phase-filter">
        <Button
          variant={langFilter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          className="rounded-full"
          onClick={() => setLangFilter('all')}
        >
          All
        </Button>
        {ALL_LANGS.map(l => {
          const meta  = LANG_META[l]
          const count = allSnippets.filter(snip => snip.lang === l).length
          if (count === 0) return null
          return (
            <Button
              key={l}
              variant={langFilter === l ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-full"
              onClick={() => setLangFilter(l)}
            >
              <span className="dot" style={{ background: meta.fg }} />
              {meta.label}
              <span style={{ color: 'var(--fg-5)', fontSize: 10 }}>{count}</span>
            </Button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="lab-grid" style={{ paddingTop: 0 }}>
          {filtered.map(snip => (
            <div key={snip.id} className="snip-page-card">
              <div className="snip-page-source">
                <span style={{ color: 'var(--fg-5)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                  idea:
                </span>
                <Button variant="ghost" size="sm" onClick={() => onOpen(snip.ideaId)}>
                  {snip.ideaTitle}
                </Button>
              </div>
              <div className="snip-page-inner">
                <SnippetView snip={snip} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">{'</>'}</div>
          <div className="empty-state-text">
            No snippets match your search.
          </div>
        </div>
      )}
    </div>
  )
}
