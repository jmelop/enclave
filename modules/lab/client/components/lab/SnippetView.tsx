import { useState } from 'react'
import type { Snippet } from '@/types/lab'
import { LANG_META, copyText } from '@/lib/utils'
import { CodeBlock } from './CodeBlock'

interface SnippetViewProps {
  snip: Snippet
}

export function SnippetView({ snip }: SnippetViewProps) {
  const [copied, setCopied] = useState(false)
  const meta = LANG_META[snip.lang] ?? { label: snip.lang.toUpperCase(), fg: '#8a8f98' }

  function handleCopy() {
    copyText(snip.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="snip">
      <div className="snip-header">
        <span className="snip-title">{snip.title}</span>
        <span
          className="snip-lang"
          style={{ color: meta.fg, borderColor: `${meta.fg}33` }}
        >
          {meta.label}
        </span>
        <button className="snip-copy" onClick={handleCopy}>
          {copied ? 'Copiado ✓' : 'Copiar'}
        </button>
      </div>

      <CodeBlock code={snip.code} lang={snip.lang} />

      {(snip.desc || (snip.tags && snip.tags.length > 0)) && (
        <div className="snip-footer">
          {snip.desc && <div className="snip-desc">{snip.desc}</div>}
          {snip.tags && snip.tags.length > 0 && (
            <div className="snip-tags">
              {snip.tags.map(tag => (
                <span key={tag} className="snip-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
