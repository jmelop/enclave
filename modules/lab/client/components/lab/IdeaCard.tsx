import { useState, useRef, useEffect } from 'react'
import { Badge, useToast } from '@venator-ui/ui'
import type { Idea } from '@/types/lab'
import { PHASES, CATEGORIES } from '@/lib/seed'
import { useLabStore } from '@/store/labStore'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'

interface IdeaCardProps {
  idea: Idea
  onOpen: (id: string) => void
}

export function IdeaCard({ idea, onOpen }: IdeaCardProps) {
  const deleteIdea = useLabStore(s => s.deleteIdea)
  const [dropOpen, setDropOpen]       = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const phase = PHASES.find(p => p.id === idea.phase)
  const cat = CATEGORIES.find(c => c.id === idea.category)

  useEffect(() => {
    if (!dropOpen) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropOpen])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteIdea(idea.id)
      setConfirmOpen(false)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Delete failed', variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="idea-card" onClick={() => onOpen(idea.id)}>
      <div className="idea-card-top">
        <span className="idea-cat">{cat?.label ?? idea.category}</span>
        {phase && (
          <Badge color={phase.color} dot pill size="sm">
            {phase.label}
          </Badge>
        )}
        <div ref={dropRef} style={{ position: 'relative', marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
          <button
            className="icon-btn"
            title="More options"
            onClick={() => setDropOpen(o => !o)}
            style={{ width: 26, padding: 0, fontWeight: 700, fontSize: 14, letterSpacing: 1 }}
          >
            ···
          </button>
          {dropOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 4,
              minWidth: 110, zIndex: 10,
              background: 'var(--bg-2)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              padding: '4px 0',
            }}>
              <button
                onClick={() => { setDropOpen(false); onOpen(idea.id) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--fg-1)', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Edit
              </button>
              <button
                onClick={() => { setDropOpen(false); setConfirmOpen(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="idea-title">{idea.title}</p>

      {idea.notes && (
        <p className="idea-notes">{idea.notes}</p>
      )}

      <div className="idea-footer">
        <span className="idea-snip-count">
          {'</>'} {idea.snippets.length}
        </span>
        {idea.links.length > 0 ? (
          <span className="idea-links">
            {idea.links.map((lk, i) => (
              <Badge key={i} variant="default" size="sm">{lk.label}</Badge>
            ))}
          </span>
        ) : (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-5)' }}>
            {idea.updated}
          </span>
        )}
      </div>

      <ConfirmDeleteModal
        open={confirmOpen}
        itemName={idea.title}
        title="Delete idea"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
