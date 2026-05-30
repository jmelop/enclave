import { useState } from 'react'
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
  const ideas = useLabStore(s => s.ideas)
  const [query, setQuery] = useState('')
  const [langFilter, setLangFilter] = useState<LangFilter>('all')

  // Flatten all snippets with their source idea
  const allSnippets = ideas.flatMap(idea =>
    idea.snippets.map(snip => ({ snip, idea }))
  )

  const filtered = allSnippets.filter(({ snip }) => {
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
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="search-input"
            placeholder="Buscar snippets..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Lang filter pills */}
      <div className="phase-filter">
        <button
          className={`phase-pill${langFilter === 'all' ? ' active' : ''}`}
          onClick={() => setLangFilter('all')}
        >
          Todos
        </button>
        {ALL_LANGS.map(l => {
          const meta = LANG_META[l]
          const count = allSnippets.filter(({ snip }) => snip.lang === l).length
          if (count === 0) return null
          return (
            <button
              key={l}
              className={`phase-pill${langFilter === l ? ' active' : ''}`}
              onClick={() => setLangFilter(l)}
            >
              <span className="dot" style={{ background: meta.fg }} />
              {meta.label}
              <span style={{ color: 'var(--fg-5)', fontSize: 10 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="lab-grid" style={{ paddingTop: 0 }}>
          {filtered.map(({ snip, idea }) => (
            <div key={snip.id} className="snip-page-card">
              <div className="snip-page-source">
                <span style={{ color: 'var(--fg-5)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                  idea:
                </span>
                <button onClick={() => onOpen(idea.id)}>
                  {idea.title}
                </button>
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
            {query || langFilter !== 'all'
              ? 'No hay snippets que coincidan.'
              : 'Añade snippets a tus ideas para verlos aquí.'}
          </div>
        </div>
      )}
    </div>
  )
}
