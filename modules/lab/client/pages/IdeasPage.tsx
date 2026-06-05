import { Button, Input, Select } from '@venator-ui/ui'
import { useLabStore } from '@/store/labStore'
import { PHASES, CATEGORIES } from '@/lib/seed'
import { IdeaCard } from '@/components/lab/IdeaCard'
import type { PhaseId, CategoryId } from '@/types/lab'

interface IdeasPageProps {
  onOpen: (id: string) => void
}

export function IdeasPage({ onOpen }: IdeasPageProps) {
  const ideas      = useLabStore(s => s.ideas)
  const loading    = useLabStore(s => s.loading)
  const error      = useLabStore(s => s.error)
  const hydrated   = useLabStore(s => s.hydrated)
  const refetch    = useLabStore(s => s.refetch)
  const query      = useLabStore(s => s.query)
  const phase      = useLabStore(s => s.phase)
  const category   = useLabStore(s => s.category)
  const setQuery   = useLabStore(s => s.setQuery)
  const setPhase   = useLabStore(s => s.setPhase)
  const setCategory = useLabStore(s => s.setCategory)

  // ── 4 UI states ────────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>
        Loading ideas…
      </div>
    )
  }

  if (error && !hydrated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
        <span style={{ color: 'var(--danger)' }}>Failed to load ideas: {error}</span>
        <Button variant="accent" size="sm" onClick={() => void refetch()}>Retry</Button>
      </div>
    )
  }

  if (hydrated && ideas.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh', color: 'var(--fg-3)' }}>
        <div className="empty-state-icon">◉</div>
        <span>No ideas yet. Create your first one!</span>
      </div>
    )
  }

  // ── Normal list state ──────────────────────────────────────────────────────

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
        <Input
          placeholder="Search ideas..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          }
          style={{ width: 260 }}
        />

        <Select
          value={category}
          onChange={e => setCategory(e.target.value as CategoryId | 'all')}
          style={{ width: 200 }}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </Select>
      </div>

      {/* Phase pills */}
      <div className="phase-filter">
        <Button
          variant={phase === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          className="rounded-full"
          onClick={() => setPhase('all')}
        >
          All
          <span style={{ color: 'var(--fg-5)', fontSize: 10 }}>{active.length}</span>
        </Button>
        {PHASES.filter(p => p.id !== 'archived').map(ph => {
          const count = active.filter(i => i.phase === ph.id).length
          return (
            <Button
              key={ph.id}
              variant={phase === ph.id ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-full"
              onClick={() => setPhase(ph.id as PhaseId)}
            >
              <span className="dot" style={{ background: ph.color }} />
              {ph.label}
              <span style={{ color: 'var(--fg-5)', fontSize: 10 }}>{count}</span>
            </Button>
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
            No ideas match the current filters.
          </div>
        </div>
      )}
    </div>
  )
}
