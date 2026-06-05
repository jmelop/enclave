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
  // Local draft buffers live edits so onUpdate (→ PUT) is NOT called on every
  // keystroke. Fires only on blur (title, notes) and discrete events (selects,
  // snippet add). `idea` controls the open/closed CSS state; `draft` controls
  // the rendered content — initialised from `idea` and synced on every change.
  const [draft, setDraft] = useState<Idea | null>(idea)
  const [addingSnip, setAddingSnip] = useState(false)

  useEffect(() => { setDraft(idea) }, [idea])

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

  // `idea` drives open/closed so CSS transitions work.
  // `content` uses `draft ?? idea` to avoid a blank frame on first open.
  const content = draft ?? idea

  function handlePhaseChange(val: PhaseId) {
    if (!content) return
    const updated = { ...content, phase: val }
    setDraft(updated)
    onUpdate(updated)
  }

  function handleCategoryChange(val: CategoryId) {
    if (!content) return
    const updated = { ...content, category: val }
    setDraft(updated)
    onUpdate(updated)
  }

  function handleAddSnippet(snip: Snippet) {
    if (!content) return
    const updated = { ...content, snippets: [...content.snippets, snip] }
    setDraft(updated)
    onUpdate(updated)
    setAddingSnip(false)
  }

  const phase = content ? PHASES.find(p => p.id === content.phase) : undefined
  const cat   = content ? CATEGORIES.find(c => c.id === content.category) : undefined

  return (
    <>
      <div className={`lab-scrim${idea ? ' open' : ''}`} onClick={onClose} />

      <div className={`lab-panel${idea ? ' open' : ''}`}>
        {content && (
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
                {cat?.label ?? content.category}
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
              {/* Title — saves on blur */}
              <textarea
                className="title-edit"
                value={content.title}
                onChange={e => setDraft({ ...content, title: e.target.value })}
                onBlur={() => draft && onUpdate(draft)}
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
                    value={content.phase}
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
                    value={content.category}
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
                    {content.updated}
                  </span>
                </div>
              </div>

              {/* Notes — saves on blur */}
              <div className="field">
                <Label htmlFor="panel-notes">Notes</Label>
                <textarea
                  id="panel-notes"
                  className="notes-edit"
                  value={content.notes}
                  onChange={e => setDraft({ ...content, notes: e.target.value })}
                  onBlur={() => draft && onUpdate(draft)}
                  placeholder="Write your notes here..."
                  rows={4}
                />
              </div>

              {/* Links */}
              {content.links.length > 0 && (
                <div>
                  <div className="panel-section-h">Links</div>
                  <div className="panel-links">
                    {content.links.map((lk, i) => (
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
                  Snippets ({content.snippets.length})
                </div>
                <div className="panel-snippets">
                  {content.snippets.map(snip => (
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
