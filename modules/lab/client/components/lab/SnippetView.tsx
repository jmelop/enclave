import { useState, useRef, useEffect } from 'react'
import { Badge, Button } from '@venator-ui/ui'
import type { Snippet } from '@/types/lab'
import { LANG_META, copyText } from '@/lib/utils'
import { CodeBlock } from './CodeBlock'

interface SnippetViewProps {
  snip: Snippet
  onEdit?: () => void
  onDelete?: () => void
}

export function SnippetView({ snip, onEdit, onDelete }: SnippetViewProps) {
  const [copied, setCopied] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const meta = LANG_META[snip.lang] ?? { label: snip.lang.toUpperCase(), fg: '#8a8f98' }

  useEffect(() => {
    if (!dropOpen) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropOpen])

  function handleCopy() {
    copyText(snip.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="snip">
      <div className="snip-header">
        <span className="snip-title">{snip.title}</span>

        <Badge color={meta.fg} size="sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {meta.label}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          style={{ marginLeft: 'auto', color: copied ? 'var(--success)' : undefined }}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </Button>

        {(onEdit || onDelete) && (
          <div ref={dropRef} style={{ position: 'relative' }}>
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
                {onEdit && (
                  <button
                    onClick={() => { setDropOpen(false); onEdit() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--fg-1)', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { setDropOpen(false); onDelete() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <CodeBlock code={snip.code} lang={snip.lang} />

      {(snip.desc || (snip.tags && snip.tags.length > 0)) && (
        <div className="snip-footer">
          {snip.desc && <div className="snip-desc">{snip.desc}</div>}
          {snip.tags && snip.tags.length > 0 && (
            <div className="snip-tags">
              {snip.tags.map(tag => (
                <Badge key={tag} variant="default" size="sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
