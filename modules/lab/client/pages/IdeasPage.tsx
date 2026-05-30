import { useLabStore } from '@/store/labStore'
import { PHASES, CATEGORIES } from '@/lib/seed'
import { IdeaCard } from '@/components/lab/IdeaCard'
import type { PhaseId, CategoryId } from '@/types/lab'

interface IdeasPageProps {
  onOpen: (id: string) => void
}

export function IdeasPage({ onOpen }: IdeasPageProps) {
  const ideas      = useLabStore(s => s.ideas)
  const query      = useLabStore(s => s.query)
  const phase      = useLabStore(s => s.phase)
  const category   = useLabStore(s => s.category)
  const setQuery   = useLabStore(s => s.setQuery)
  const setPhase   = useLabStore(s => s.setPhase)
  const setCategory = useLabStore(s => s.setCategory)

  // Active (non-archived) ideas
  const active = ideas.filter(i => i.phase !== 'archived')

  const filtered = active.filter(idea => {
    if (phase !== 'all' && idea.phase !== phase) return false
    if (category !== 'all' && idea.category !== category) return false
    if (query) {
      const q = query.toLowerCase()
      return (
        idea.title.toLowerCase().includes(q) ||
        idea.notes.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* Search */}
        <div className="search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="search-input"
            placeholder="Buscar ideas..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <select
          className="select"
          value={category}
          onChange={e => setCategory(e.target.value as CategoryId | 'all')}
        >
          <option value="all">Todas las categorías</option>
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Phase pills */}
      <div className="phase-filter">
        <button
          className={`phase-pill${phase === 'all' ? ' active' : ''}`}
          onClick={() => setPhase('all')}
        >
          Todas
          <span style={{ color: 'var(--fg-5)', fontSize: 10 }}>{active.length}</span>
        </button>
        {PHASES.filter(p => p.id !== 'archived').map(ph => {
          const count = active.filter(i => i.phase === ph.id).length
          return (
            <button
              key={ph.id}
              className={`phase-pill${phase === ph.id ? ' active' : ''}`}
              onClick={() => setPhase(ph.id as PhaseId)}
            >
              <span className="dot" style={{ background: ph.color }} />
              {ph.label}
              <span style={{ color: 'var(--fg-5)', fontSize: 10 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="lab-grid">
          {filtered.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">◉</div>
          <div className="empty-state-text">
            {query || phase !== 'all' || category !== 'all'
              ? 'No hay ideas que coincidan con los filtros.'
              : 'No hay ideas todavía. ¡Crea la primera!'}
          </div>
        </div>
      )}
    </div>
  )
}
