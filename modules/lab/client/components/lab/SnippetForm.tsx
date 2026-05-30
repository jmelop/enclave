import { useState } from 'react'
import type { Snippet, Lang } from '@/types/lab'
import { LANG_META, today } from '@/lib/utils'

interface SnippetFormProps {
  onSave: (snip: Snippet) => void
  onCancel: () => void
}

const LANGS = Object.keys(LANG_META) as Lang[]

export function SnippetForm({ onSave, onCancel }: SnippetFormProps) {
  const [title, setTitle] = useState('')
  const [lang, setLang] = useState<Lang>('ts')
  const [code, setCode] = useState('')
  const [desc, setDesc] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')

  const canSave = title.trim().length > 0 && code.trim().length > 0

  function handleSave() {
    if (!canSave) return
    const tags = tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    onSave({
      id: `snip-${Date.now()}`,
      title: title.trim(),
      lang,
      code: code.trim(),
      desc: desc.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
    // Reset
    setTitle(''); setCode(''); setDesc(''); setTagsRaw('')
  }

  // Suppress TS unused parameter warning — today() used for id uniqueness above
  void today

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--bg-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="field">
        <label className="field-lbl">Título</label>
        <input
          className="search-input"
          style={{ width: '100%', paddingLeft: 12 }}
          placeholder="Nombre del snippet"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-lbl">Lenguaje</label>
        <select
          className="select"
          value={lang}
          onChange={e => setLang(e.target.value as Lang)}
        >
          {LANGS.map(l => (
            <option key={l} value={l}>{LANG_META[l].label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-lbl">Código</label>
        <textarea
          className="notes-edit"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 7,
            padding: '8px 10px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12.5,
            minHeight: 100,
          }}
          placeholder="// Pega el código aquí..."
          value={code}
          onChange={e => setCode(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-lbl">Descripción (opcional)</label>
        <input
          className="search-input"
          style={{ width: '100%', paddingLeft: 12 }}
          placeholder="Breve descripción"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-lbl">Tags (coma-separados)</label>
        <input
          className="search-input"
          style={{ width: '100%', paddingLeft: 12 }}
          placeholder="cache, utils, api"
          value={tagsRaw}
          onChange={e => setTagsRaw(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button
          className="btn btn-primary"
          disabled={!canSave}
          onClick={handleSave}
          style={{ opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}
        >
          Guardar
        </button>
      </div>
    </div>
  )
}
