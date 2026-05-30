import { useState } from 'react'
import { useLabStore } from '@/store/labStore'
import { PHASES, CATEGORIES } from '@/lib/seed'
import type { PhaseId } from '@/types/lab'

interface BoardPageProps {
  onOpen: (id: string) => void
}

export function BoardPage({ onOpen }: BoardPageProps) {
  const ideas = useLabStore(s => s.ideas)
  const setIdeaPhase = useLabStore(s => s.setIdeaPhase)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overPhase, setOverPhase] = useState<PhaseId | null>(null)

  function handleDragStart(id: string) {
    setDragId(id)
  }

  function handleDragEnd() {
    setDragId(null)
    setOverPhase(null)
  }

  function handleDragOver(e: React.DragEvent, phaseId: PhaseId) {
    e.preventDefault()
    setOverPhase(phaseId)
  }

  function handleDragLeave() {
    setOverPhase(null)
  }

  function handleDrop(e: React.DragEvent, phaseId: PhaseId) {
    e.preventDefault()
    if (dragId) {
      setIdeaPhase(dragId, phaseId)
    }
    setDragId(null)
    setOverPhase(null)
  }

  return (
    <div className="lab-board">
      {PHASES.map(phase => {
        const col = ideas.filter(i => i.phase === phase.id)
        const isOver = overPhase === phase.id

        return (
          <div
            key={phase.id}
            className={`lab-col${isOver ? ' drag-over' : ''}`}
            onDragOver={e => handleDragOver(e, phase.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, phase.id)}
          >
            <div className="lab-col-header">
              <span className="phase-badge" style={{ border: 'none', background: 'none', padding: '0' }}>
                <span className="dot" style={{ background: phase.color }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)' }}>{phase.label}</span>
              </span>
              <span className="lab-col-count">{col.length}</span>
            </div>

            <div className="lab-col-body">
              {col.map(idea => {
                const cat = CATEGORIES.find(c => c.id === idea.category)
                return (
                  <div
                    key={idea.id}
                    className="lab-mini-card"
                    draggable
                    onDragStart={() => handleDragStart(idea.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onOpen(idea.id)}
                    style={{ opacity: dragId === idea.id ? 0.4 : 1 }}
                  >
                    <div className="lab-mini-card-cat">{cat?.label ?? idea.category}</div>
                    <div className="lab-mini-card-title">{idea.title}</div>
                    <div className="lab-mini-card-meta">
                      <span>{'</>'} {idea.snippets.length}</span>
                      {idea.links.length > 0 && (
                        <span>↗ {idea.links.length}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
