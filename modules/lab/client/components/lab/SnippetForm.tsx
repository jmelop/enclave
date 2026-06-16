import { useState } from 'react'
import { Button, Input, Label, Select } from '@venator-ui/ui'
import type { Snippet, Lang } from '@/types/lab'
import { LANG_META } from '@/lib/utils'

interface SnippetFormProps {
  initialSnip?: Snippet
  onSave: (snip: Snippet) => void
  onCancel: () => void
}

const LANGS = Object.keys(LANG_META) as Lang[]

export function SnippetForm({ initialSnip, onSave, onCancel }: SnippetFormProps) {
  const [title, setTitle] = useState(initialSnip?.title ?? '')
  const [lang, setLang] = useState<Lang>(initialSnip?.lang ?? 'ts')
  const [code, setCode] = useState(initialSnip?.code ?? '')
  const [desc, setDesc] = useState(initialSnip?.desc ?? '')
  const [tagsRaw, setTagsRaw] = useState(initialSnip?.tags?.join(', ') ?? '')

  const canSave = title.trim().length > 0 && code.trim().length > 0

  function handleSave() {
    if (!canSave) return
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    onSave({
      id: initialSnip?.id ?? `snip-${Date.now()}`,
      title: title.trim(),
      lang,
      code: code.trim(),
      desc: desc.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
    if (!initialSnip) {
      setTitle(''); setCode(''); setDesc(''); setTagsRaw('')
    }
  }

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
        <Label htmlFor="snip-title">Title</Label>
        <Input
          id="snip-title"
          placeholder="Snippet name"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <Label htmlFor="snip-lang">Language</Label>
        <Select
          id="snip-lang"
          value={lang}
          onChange={e => setLang(e.target.value as Lang)}
        >
          {LANGS.map(l => (
            <option key={l} value={l}>{LANG_META[l].label}</option>
          ))}
        </Select>
      </div>

      <div className="field">
        <Label htmlFor="snip-code">Code</Label>
        <textarea
          id="snip-code"
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
          placeholder="// Paste your code here..."
          value={code}
          onChange={e => setCode(e.target.value)}
        />
      </div>

      <div className="field">
        <Label htmlFor="snip-desc">Description (optional)</Label>
        <Input
          id="snip-desc"
          placeholder="Short description"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div className="field">
        <Label htmlFor="snip-tags">Tags (comma-separated)</Label>
        <Input
          id="snip-tags"
          placeholder="cache, utils, api"
          value={tagsRaw}
          onChange={e => setTagsRaw(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" disabled={!canSave} onClick={handleSave}>
          {initialSnip ? 'Update' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
