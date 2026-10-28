import { useState } from 'react'
import { PlatformTag } from './PlatformTag'
import { hasPlatform, joinPlatforms, parsePlatforms } from '@/lib/utils'

interface PlatformEditorProps {
  value: string | null
  known: string[]   // platforms used anywhere, offered as one-click suggestions
  onChange: (value: string | null) => void
}

export function PlatformEditor({ value, known, onChange }: PlatformEditorProps) {
  const list = parsePlatforms(value)
  const [draft, setDraft] = useState('')

  const add = (raw: string = draft) => {
    const v = raw.trim()
    if (v && !hasPlatform(list, v)) onChange(joinPlatforms([...list, v]))
    setDraft('')
  }

  const suggestions = known.filter((k) => !hasPlatform(list, k))

  return (
    <div className="stk-pf-wrap">
      <div className="stk-pf-editor">
        {list.map((p) => (
          <PlatformTag key={p} name={p} onRemove={() => onChange(joinPlatforms(list.filter((x) => x !== p)))} />
        ))}
        <input
          className="mono"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => add()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
            if (e.key === 'Backspace' && !draft && list.length > 0) onChange(joinPlatforms(list.slice(0, -1)))
          }}
          placeholder={list.length > 0 ? 'add…' : 'Wallapop, web…'}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="stk-pf-suggest">
          <span className="stk-pf-suggest-lbl mono">used elsewhere</span>
          {suggestions.map((s) => (
            <button type="button" key={s} className="stk-pf-add mono" onClick={() => add(s)}>+ {s}</button>
          ))}
        </div>
      )}
      <div className="stk-pf-raw mono">platforms = {value ? `"${value}"` : 'NULL'}</div>
    </div>
  )
}
