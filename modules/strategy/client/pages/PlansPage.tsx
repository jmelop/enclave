import { useState, useEffect, useRef } from 'react'
import { Card, Checkbox, Badge, useToast } from '@venator-ui/ui'
import { Plus } from 'lucide-react'
import { useStrategyStore } from '@/store/strategyStore'
import { GoalDot } from '@/components/strategy/GoalDot'
import { FilterBar } from '@/components/strategy/FilterBar'
import { SegControl } from '@/components/strategy/SegControl'
import { DueChip } from '@/components/strategy/DueChip'
import { ConfirmDeleteModal } from '@/components/strategy/ConfirmDeleteModal'
import type { Plan, Goal } from '@/types/strategy'
import type { ModalType } from '@/components/strategy/CreateModal'

type OnEditFn = (type: ModalType, id: string, prefill: Plan) => void

interface Props {
  goalFilter?: string
  onNavigate: (view: string, goalId?: string) => void
  onEdit: OnEditFn
}

// ── PlanRow ───────────────────────────────────────────────────────────────────

interface PlanRowProps {
  plan: Plan
  goalObj?: Goal
  onNavigate: Props['onNavigate']
  onEdit: OnEditFn
}

function PlanRow({ plan: p, goalObj: g, onNavigate, onEdit }: PlanRowProps) {
  const togglePlan = useStrategyStore(s => s.togglePlan)
  const deletePlan = useStrategyStore(s => s.deletePlan)
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
      await deletePlan(p.id)
      setConfirmOpen(false)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Delete failed', variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 160px 80px 120px 36px', gap: 12, alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
      <Checkbox checked={p.done} onCheckedChange={() => void togglePlan(p.id)} />
      <span style={{ fontSize: 13, color: p.done ? 'var(--fg-4)' : 'var(--fg)', textDecoration: p.done ? 'line-through' : 'none' }}>{p.title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: 'var(--fg-3)', fontSize: 12 }} onClick={() => onNavigate('goals', g?.id)}>
        {g && <GoalDot goal={g} size={7} />}
        {g?.name}
      </div>
      <Badge size="sm" variant="default">{p.horizon}</Badge>
      <DueChip iso={p.due} />
      <div ref={dropRef} style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
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
              onClick={() => { setDropOpen(false); onEdit('plan', p.id, p) }}
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
          itemName={p.title}
          title="Delete plan"
          loading={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </div>
  )
}

// ── PlansPage ─────────────────────────────────────────────────────────────────

export function PlansPage({ goalFilter: initial, onNavigate, onEdit }: Props) {
  const { goals, plans } = useStrategyStore()
  const [goalId, setGoalId] = useState<string | null>(initial ?? null)
  const [horizon, setHorizon] = useState('all')

  const filtered = plans.filter(p => {
    if (goalId && p.goal !== goalId) return false
    if (horizon !== 'all' && p.horizon !== horizon) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <FilterBar goals={goals} value={goalId} onChange={setGoalId} />
        <SegControl
          value={horizon}
          options={[{ value: 'all', label: 'All' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]}
          onChange={setHorizon}
        />
      </div>

      <Card padding="none">
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 160px 80px 120px 36px', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-2)' }}>
          {['', 'Action step', 'Goal', 'Horizon', 'Due', ''].map((h, i) => (
            <span key={i} className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', letterSpacing: '0.1em' }}>{h}</span>
          ))}
        </div>
        {filtered.map(p => (
          <PlanRow key={p.id} plan={p} goalObj={goals.find(x => x.id === p.goal)} onNavigate={onNavigate} onEdit={onEdit} />
        ))}
        {!filtered.length && (
          <div className="mono" style={{ padding: 32, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>No plans match this filter</div>
        )}
      </Card>

      <button className="add-snip" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 13, borderRadius: 10, border: '1px dashed var(--border-default)', background: 'transparent', color: 'var(--fg-4)', fontSize: 12.5, cursor: 'pointer', width: '100%' }}>
        <Plus size={15} style={{ color: 'var(--accent)' }} /> Add plan
      </button>
    </div>
  )
}
