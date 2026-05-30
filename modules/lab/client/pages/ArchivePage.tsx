import { useState } from 'react'
import { useLabStore } from '@/store/labStore'
import { IdeaCard } from '@/components/lab/IdeaCard'

interface ArchivePageProps {
  onOpen: (id: string) => void
}

export function ArchivePage({ onOpen }: ArchivePageProps) {
  const ideas = useLabStore(s => s.ideas)
  const [query, setQuery] = useState('')

  const archived = ideas.filter(i => i.phase === 'archived')

  const filtered = archived.filter(idea => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      idea.title.toLowerCase().includes(q) ||
      idea.notes.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div className="search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="search-input"
            placeholder="Buscar en archivo..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="lab-grid">
          {filtered.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">⊟</div>
          <div className="empty-state-text">
            {query
              ? 'No hay ideas archivadas que coincidan.'
              : 'No hay ideas archivadas. Cambia la fase de una idea a "Archivado" para verla aquí.'}
          </div>
        </div>
      )}
    </div>
  )
}
