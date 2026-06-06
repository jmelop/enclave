import { useState, useEffect, useRef } from 'react'
import { Card, useToast } from '@venator-ui/ui'
import { useStrategyStore } from '@/store/strategyStore'
import { goalColor } from '@/lib/seed'
import { GoalDot } from '@/components/strategy/GoalDot'
import { FilterBar } from '@/components/strategy/FilterBar'
import { SegControl } from '@/components/strategy/SegControl'
import { ConfirmDeleteModal } from '@/components/strategy/ConfirmDeleteModal'
import type { Result, Goal } from '@/types/strategy'
import type { ModalType } from '@/components/strategy/CreateModal'

type OnEditFn = (type: ModalType, id: string, prefill: Result) => void

interface Props {
  goalFilter?: string
  onNavigate: (view: string, goalId?: string) => void
  onEdit: OnEditFn
}

// ── ResultCard ────────────────────────────────────────────────────────────────

interface ResultCardProps {
  result: Result
  goalObj?: Goal
  onNavigate: Props['onNavigate']
  onEdit: OnEditFn
}

function ResultCard({ result: r, goalObj: g, onNavigate, onEdit }: ResultCardProps) {
  const deleteResult = useStrategyStore(s => s.deleteResult)
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
      await deleteResult(r.id)
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 12px 18px', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c }} />
        {g && <><GoalDot goal={g} size={8} /><span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)', cursor: 'pointer' }} onClick={() => onNavigate('goals', g.id)}>{g.name}</span></>}
        <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--bg-3)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '2px 7px', color: 'var(--fg-3)' }} className="mono">
          {r.cadence === 'weekly' ? 'weekly' : 'monthly'}
        </span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{r.period}</span>
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
                onClick={() => { setDropOpen(false); onEdit('result', r.id, r) }}
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
            itemName={r.period}
            title="Delete result"
            loading={deleting}
            onConfirm={() => void handleDelete()}
            onCancel={() => setConfirmOpen(false)}
          />
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'GOOD', text: r.good, color: 'var(--success)' },
          { label: 'BAD',  text: r.bad,  color: 'var(--danger)' },
          { label: 'CHANGE', text: r.change, color: c },
        ].map(({ label, text, color }) => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, alignItems: 'start' }}>
            <span className="mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color, paddingTop: 2 }}>{label}</span>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: label === 'CHANGE' ? 'var(--fg)' : 'var(--fg-2)', margin: 0, fontWeight: label === 'CHANGE' ? 500 : 400 }}>{text}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── ResultsPage ───────────────────────────────────────────────────────────────

export function ResultsPage({ goalFilter: initial, onNavigate, onEdit }: Props) {
  const { goals, results } = useStrategyStore()
  const [goalId, setGoalId] = useState<string | null>(initial ?? null)
  const [cadence, setCadence] = useState('all')

  const filtered = [...results]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(r => {
      if (goalId && r.goal !== goalId) return false
      if (cadence !== 'all' && r.cadence !== cadence) return false
      return true
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <FilterBar goals={goals} value={goalId} onChange={setGoalId} />
        <SegControl
          value={cadence}
          options={[{ value: 'all', label: 'All' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]}
          onChange={setCadence}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
        {filtered.map(r => (
          <ResultCard key={r.id} result={r} goalObj={goals.find(g => g.id === r.goal)} onNavigate={onNavigate} onEdit={onEdit} />
        ))}
        {!filtered.length && <div className="mono" style={{ padding: 32, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>No results match this filter</div>}
      </div>
    </div>
  )
}
