import { Badge } from '@venator-ui/ui'
import type { Idea } from '@/types/lab'
import { PHASES, CATEGORIES } from '@/lib/seed'

interface IdeaCardProps {
  idea: Idea
  onOpen: (id: string) => void
}

export function IdeaCard({ idea, onOpen }: IdeaCardProps) {
  const phase = PHASES.find(p => p.id === idea.phase)
  const cat = CATEGORIES.find(c => c.id === idea.category)

  return (
    <div className="idea-card" onClick={() => onOpen(idea.id)}>
      <div className="idea-card-top">
        <span className="idea-cat">{cat?.label ?? idea.category}</span>
        {phase && (
          <Badge color={phase.color} dot pill size="sm">
            {phase.label}
          </Badge>
        )}
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
    </div>
  )
}
