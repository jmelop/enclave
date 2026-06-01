import { useLabStore } from '@/store/labStore'

interface TagsPageProps {
  onOpen: (id: string) => void
}

interface TagEntry {
  snippetTitle: string
  ideaId: string
  ideaTitle: string
}

interface TagData {
  tag: string
  usages: TagEntry[]
}

export function TagsPage({ onOpen }: TagsPageProps) {
  const ideas = useLabStore(s => s.ideas)

  // Collect all tags across all snippets in all ideas
  const tagMap = new Map<string, TagEntry[]>()

  for (const idea of ideas) {
    for (const snip of idea.snippets) {
      if (!snip.tags) continue
      for (const tag of snip.tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, [])
        tagMap.get(tag)!.push({
          snippetTitle: snip.title,
          ideaId: idea.id,
          ideaTitle: idea.title,
        })
      }
    }
  }

  const tags: TagData[] = Array.from(tagMap.entries())
    .map(([tag, usages]) => ({ tag, usages }))
    .sort((a, b) => b.usages.length - a.usages.length)

  if (tags.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">#</div>
        <div className="empty-state-text">
          Add tags to your snippets to see them here.
        </div>
      </div>
    )
  }

  return (
    <div className="lab-grid">
      {tags.map(({ tag, usages }) => (
        <div key={tag} className="tag-card">
          <div className="tag-card-header">
            <span className="tag-name">#{tag}</span>
            <span className="tag-count">{usages.length} use{usages.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="tag-usages">
            {usages.map((u, i) => (
              <div
                key={i}
                className="tag-usage"
                style={{ cursor: 'pointer' }}
                onClick={() => onOpen(u.ideaId)}
              >
                <span className="tag-usage-snip">{u.snippetTitle}</span>
                <span style={{ color: 'var(--fg-5)' }}>→</span>
                <span className="tag-usage-idea">{u.ideaTitle}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
