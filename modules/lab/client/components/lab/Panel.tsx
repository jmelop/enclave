import { useEffect, useState } from 'react'
import { Badge, Button, Label, Select } from '@venator-ui/ui'
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

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && idea) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idea, onClose])

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
      <div className={`lab-scrim${idea ? ' open' : ''}`} onClick={onClose} />

      <div className={`lab-panel${idea ? ' open' : ''}`}>
        {idea && (
          <>
            {/* Header */}
            <div className="panel-header">
              {phase && (
                <Badge color={phase.color} dot pill size="sm">
                  {phase.label}
                </Badge>
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
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={onClose}
                title="Cerrar (Esc)"
              >
                ✕
              </Button>
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
                  <Label htmlFor="panel-phase">Phase</Label>
                  <Select
                    id="panel-phase"
                    value={idea.phase}
                    onChange={e => handlePhaseChange(e.target.value as PhaseId)}
                  >
                    {PHASES.map(ph => (
                      <option key={ph.id} value={ph.id}>{ph.label}</option>
                    ))}
                  </Select>
                </div>

                <div className="field">
                  <Label htmlFor="panel-cat">Category</Label>
                  <Select
                    id="panel-cat"
                    value={idea.category}
                    onChange={e => handleCategoryChange(e.target.value as CategoryId)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </Select>
                </div>

                <div className="field">
                  <Label>Updated</Label>
                  <span style={{ fontSize: 12.5, color: 'var(--fg-3)', padding: '5px 0' }}>
                    {idea.updated}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="field">
                <Label htmlFor="panel-notes">Notes</Label>
                <textarea
                  id="panel-notes"
                  className="notes-edit"
                  value={idea.notes}
                  onChange={e => handleNotesChange(e.target.value)}
                  placeholder="Write your notes here..."
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
                    <button className="add-snip" onClick={() => setAddingSnip(true)}>
                      <span style={{ fontSize: 16 }}>+</span>
                      Add snippet
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
