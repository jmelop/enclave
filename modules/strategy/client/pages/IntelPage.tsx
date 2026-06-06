import { useState, useEffect, useRef } from 'react'
import { Card, Badge, useToast } from '@venator-ui/ui'
import { useStrategyStore } from '@/store/strategyStore'
import { goalColor, fmtDate } from '@/lib/seed'
import { GoalDot } from '@/components/strategy/GoalDot'
import { FilterBar } from '@/components/strategy/FilterBar'
import { SegControl } from '@/components/strategy/SegControl'
import { ConfirmDeleteModal } from '@/components/strategy/ConfirmDeleteModal'
import type { Intel, Goal } from '@/types/strategy'
import type { ModalType } from '@/components/strategy/CreateModal'

type OnEditFn = (type: ModalType, id: string, prefill: Intel) => void

interface Props {
  goalFilter?: string
  onNavigate: (view: string, goalId?: string) => void
  onEdit: OnEditFn
}

// ── IntelCard ─────────────────────────────────────────────────────────────────

interface IntelCardProps {
  item: Intel
  goalObj?: Goal
  onNavigate: Props['onNavigate']
  onEdit: OnEditFn
}

function IntelCard({ item: it, goalObj: g, onNavigate, onEdit }: IntelCardProps) {
  const deleteIntel = useStrategyStore(s => s.deleteIntel)
  const [dropOpen, setDropOpen]       = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

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
      await deleteIntel(it.id)
      setConfirmOpen(false)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Delete failed', variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const c = g ? goalColor(g) : 'var(--fg-4)'

  return (
    <Card padding="none">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
          {it.type === 'note' ? '📝' : '🧪'} {it.type}
        </span>
        <span style={{ marginLeft: 'auto' }} />
        {it.type === 'result' && (
          <Badge size="sm" color={it.verdict === 'win' ? 'var(--success)' : 'var(--danger)'}>
            {it.verdict === 'win' ? '✓ win' : '✗ loss'}
          </Badge>
        )}
        {g && (
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--fg-3)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => onNavigate('goals', g.id)}>
            <GoalDot goal={g} size={7} />{g.name}
          </button>
        )}
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
              <button
                onClick={() => { setDropOpen(false); onEdit('intel', it.id, it) }}
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
          <ConfirmDeleteModal
            open={confirmOpen}
            itemName={it.title}
            title="Delete intel"
            loading={deleting}
            onConfirm={() => void handleDelete()}
            onCancel={() => setConfirmOpen(false)}
          />
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 600, margin: 0, letterSpacing: '-0.005em' }}>{it.title}</h3>

        {it.type === 'note' ? (
          <p style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55, margin: 0 }}>{it.body}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'did', text: it.did },
              { label: 'expected', text: it.expected },
            ].map(({ label, text }) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 10 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingTop: 2 }}>{label}</span>
                <p style={{ fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.5, margin: 0 }}>{text}</p>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 10, padding: '9px 10px', borderRadius: 9, background: `color-mix(in oklab, ${c} 8%, transparent)`, border: `1px solid color-mix(in oklab, ${c} 22%, transparent)` }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingTop: 2 }}>happened</span>
              <p style={{ fontSize: 12.5, color: 'var(--fg)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>{it.happened}</p>
            </div>
          </div>
        )}

        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', display: 'flex', alignItems: 'center', gap: 5 }}>
          📅 {fmtDate(it.date)}
        </div>
      </div>
    </Card>
  )
}

// ── IntelPage ─────────────────────────────────────────────────────────────────

export function IntelPage({ goalFilter: initial, onNavigate, onEdit }: Props) {
  const { goals, intel } = useStrategyStore()
  const [goalId, setGoalId] = useState<string | null>(initial ?? null)
  const [type, setType] = useState('all')

  const filtered = [...intel]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(it => {
      if (goalId && it.goal !== goalId) return false
      if (type !== 'all' && it.type !== type) return false
      return true
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <FilterBar goals={goals} value={goalId} onChange={setGoalId} />
        <SegControl
          value={type}
          options={[{ value: 'all', label: 'All' }, { value: 'note', label: 'Notes' }, { value: 'result', label: 'Results' }]}
          onChange={setType}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {filtered.map(it => (
          <IntelCard key={it.id} item={it} goalObj={goals.find(g => g.id === it.goal)} onNavigate={onNavigate} onEdit={onEdit} />
        ))}
        {!filtered.length && <div className="mono" style={{ padding: 32, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>No intel match this filter</div>}
      </div>
    </div>
  )
}
