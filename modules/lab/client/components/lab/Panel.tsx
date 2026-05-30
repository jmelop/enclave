import { useEffect, useState } from 'react'
import type { Idea, PhaseId, CategoryId, Snippet } from '@/types/lab'
import { PHASES, CATEGORIES } from '@/lib/seed'
import { SnippetView } from './SnippetView'
import { SnippetForm } from './SnippetForm'

interface PanelProps {
  idea: Idea | null
  onClose: () => void
  onUpdate: (idea: Idea) => void
}

export function Panel({ idea, onClose, onUpdate }: PanelProps) {
  const [addingSnip, setAddingSnip] = useState(false)

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && idea) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idea, onClose])

  // Reset addingSnip when panel closes
  useEffect(() => {
    if (!idea) setAddingSnip(false)
  }, [idea])

  function handleTitleChange(val: string) {
    if (!idea) return
    onUpdate({ ...idea, title: val })
  }

  function handleNotesChange(val: string) {
    if (!idea) return
    onUpdate({ ...idea, notes: val })
  }

  function handlePhaseChange(val: PhaseId) {
    if (!idea) return
    onUpdate({ ...idea, phase: val })
  }

  function handleCategoryChange(val: CategoryId) {
    if (!idea) return
    onUpdate({ ...idea, category: val })
  }

  function handleAddSnippet(snip: Snippet) {
    if (!idea) return
    onUpdate({ ...idea, snippets: [...idea.snippets, snip] })
    setAddingSnip(false)
  }

  const phase = PHASES.find(p => p.id === idea?.phase)
  const cat = CATEGORIES.find(c => c.id === idea?.category)

  return (
    <>
      {/* Scrim */}
      <div
        className={`lab-scrim${idea ? ' open' : ''}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`lab-panel${idea ? ' open' : ''}`}>
        {idea && (
          <>
            {/* Header */}
            <div className="panel-header">
              {phase && (
                <span className="phase-badge">
                  <span className="dot" style={{ background: phase.color }} />
                  {phase.label}
                </span>
              )}
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--fg-4)',
                }}
              >
                {cat?.label ?? idea.category}
              </span>
              <span style={{ flex: 1 }} />
              <button
                className="btn btn-ghost btn-icon"
                onClick={onClose}
                title="Cerrar (Esc)"
                style={{ fontSize: 16, color: 'var(--fg-3)' }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="panel-body">
              {/* Editable title */}
              <textarea
                className="title-edit"
                value={idea.title}
                onChange={e => handleTitleChange(e.target.value)}
                rows={2}
                onInput={e => {
                  const ta = e.currentTarget
                  ta.style.height = 'auto'
                  ta.style.height = ta.scrollHeight + 'px'
                }}
              />

              {/* Meta row */}
              <div className="panel-meta">
                <div className="field">
                  <label className="field-lbl">Fase</label>
                  <select
                    className="select"
                    value={idea.phase}
                    onChange={e => handlePhaseChange(e.target.value as PhaseId)}
                  >
                    {PHASES.map(ph => (
                      <option key={ph.id} value={ph.id}>{ph.label}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field-lbl">Categoría</label>
                  <select
                    className="select"
                    value={idea.category}
                    onChange={e => handleCategoryChange(e.target.value as CategoryId)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field-lbl">Actualizado</label>
                  <span style={{ fontSize: 12.5, color: 'var(--fg-3)', padding: '5px 0' }}>
                    {idea.updated}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="field">
                <label className="field-lbl">Notas</label>
                <textarea
                  className="notes-edit"
                  value={idea.notes}
                  onChange={e => handleNotesChange(e.target.value)}
                  placeholder="Escribe tus notas aquí..."
                  rows={4}
                />
              </div>

              {/* Links */}
              {idea.links.length > 0 && (
                <div>
                  <div className="panel-section-h">Links</div>
                  <div className="panel-links">
                    {idea.links.map((lk, i) => (
                      <a
                        key={i}
                        href={lk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="panel-link"
                      >
                        <span style={{ color: 'var(--accent)', fontSize: 12 }}>↗</span>
                        {lk.label}
                        <span style={{ fontSize: 11, color: 'var(--fg-5)' }}>({lk.type})</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Snippets */}
              <div>
                <div className="panel-section-h">
                  Snippets ({idea.snippets.length})
                </div>
                <div className="panel-snippets">
                  {idea.snippets.map(snip => (
                    <SnippetView key={snip.id} snip={snip} />
                  ))}

                  {addingSnip ? (
                    <SnippetForm
                      onSave={handleAddSnippet}
                      onCancel={() => setAddingSnip(false)}
                    />
                  ) : (
                    <button
                      className="add-snip"
                      onClick={() => setAddingSnip(true)}
                    >
                      <span style={{ fontSize: 16 }}>+</span>
                      Añadir snippet
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
