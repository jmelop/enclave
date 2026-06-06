import { useState, useEffect, useRef } from 'react'
import { Card, Badge, Button, Checkbox, useToast } from '@venator-ui/ui'
import { ChevronLeft } from 'lucide-react'
import { useStrategyStore } from '@/store/strategyStore'
import { goalColor, fmtDate, daysLeft } from '@/lib/seed'
import { GoalDot } from '@/components/strategy/GoalDot'
import { StatusPill } from '@/components/strategy/StatusPill'
import { Ring } from '@/components/strategy/Ring'
import { ProgressBar } from '@/components/strategy/ProgressBar'
import { ConfirmDeleteModal } from '@/components/strategy/ConfirmDeleteModal'
import type { Goal, Plan } from '@/types/strategy'
import type { ModalType } from '@/components/strategy/CreateModal'

type OnEditFn = (type: ModalType, id: string, prefill: Goal) => void

interface Props {
  goalId?: string
  onNavigate: (view: string, goalId?: string) => void
  onEdit: OnEditFn
}

// ── GoalDetail ────────────────────────────────────────────────────────────────

function GoalDetail({ goalId, onNavigate }: { goalId: string; onNavigate: Props['onNavigate'] }) {
  const { goals, plans, results, intel, togglePlan } = useStrategyStore()
  const g = goals.find(x => x.id === goalId)
  if (!g) return null

  const c = goalColor(g)
  const gPlans = plans.filter(p => p.goal === g.id)
  const gResults = results.filter(r => r.goal === g.id)
  const gIntel = intel.filter(it => it.goal === g.id)
  const done = gPlans.filter(p => p.done).length
  const dl = daysLeft(g.due)

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => onNavigate('goals')} className="mb-4">
        <ChevronLeft size={15} /> Goals
      </Button>

      {/* Hero */}
      <Card padding="none" className="mb-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '22px 26px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c, borderRadius: '12px 0 0 12px' }} />
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <GoalDot goal={g} size={12} glow />
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{g.name}</h1>
              {g.northStar && <Badge size="sm" color="var(--accent)">★ North Star</Badge>}
              <StatusPill status={g.status} />
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.55, marginBottom: 14 }}>{g.desc}</p>
            <div className="mono" style={{ display: 'flex', gap: 22, fontSize: 11.5, color: 'var(--fg-3)', flexWrap: 'wrap' }}>
              <span><span style={{ color: 'var(--fg-4)', marginRight: 6 }}>metric</span>{g.metricNow} / {g.metric} {g.metricUnit}</span>
              <span><span style={{ color: 'var(--fg-4)', marginRight: 6 }}>cadence</span>{g.cadence}</span>
              <span><span style={{ color: 'var(--fg-4)', marginRight: 6 }}>deadline</span>{fmtDate(g.due)} · {dl}d</span>
            </div>
          </div>
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Ring value={g.progress} color={c} size={88} stroke={6} />
            <div style={{ position: 'absolute', fontSize: 20, fontWeight: 600, color: c }}>{g.progress}<span style={{ fontSize: 11, color: 'var(--fg-4)' }}>%</span></div>
          </div>
        </div>
      </Card>

      {/* Trail: plans / results / intel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'start' }}>
        {/* Plans */}
        <Card padding="none">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Plans</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{done}/{gPlans.length}</span>
          </div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {gPlans.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 8 }}>
                <Checkbox checked={p.done} onCheckedChange={() => togglePlan(p.id)} />
                <span style={{ flex: 1, fontSize: 12.5, color: p.done ? 'var(--fg-4)' : 'var(--fg)', textDecoration: p.done ? 'line-through' : 'none' }}>{p.title}</span>
                <Badge size="sm" variant="default">{p.horizon}</Badge>
              </div>
            ))}
            {!gPlans.length && <div className="mono" style={{ padding: 12, color: 'var(--fg-5)', fontSize: 11 }}>No plans yet</div>}
          </div>
        </Card>

        {/* Results */}
        <Card padding="none">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Results</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{gResults.length}</span>
          </div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gResults.map(r => (
              <div key={r.id} style={{ padding: '10px 10px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)' }}>{r.period}</div>
                <div style={{ fontSize: 12, color: 'var(--success)' }}>+ {r.good}</div>
                <div style={{ fontSize: 12, color: 'var(--danger)' }}>− {r.bad}</div>
                <div style={{ fontSize: 12, color: c, fontWeight: 500 }}>→ {r.change}</div>
              </div>
            ))}
            {!gResults.length && <div className="mono" style={{ padding: 12, color: 'var(--fg-5)', fontSize: 11 }}>No results yet</div>}
          </div>
        </Card>

        {/* Intel */}
        <Card padding="none">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Intel</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{gIntel.length}</span>
          </div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gIntel.map(it => (
              <div key={it.id} style={{ padding: '10px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>{it.type === 'note' ? '📝' : '🧪'}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>{it.title}</span>
                  {it.type === 'result' && <Badge size="sm" color={it.verdict === 'win' ? 'var(--success)' : 'var(--danger)'}>{it.verdict}</Badge>}
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--fg-3)', lineHeight: 1.5, margin: 0 }}>
                  {it.type === 'note' ? it.body : it.happened}
                </p>
              </div>
            ))}
            {!gIntel.length && <div className="mono" style={{ padding: 12, color: 'var(--fg-5)', fontSize: 11 }}>No intel yet</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── GoalCard ──────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal
  plans: Plan[]
  onNavigate: Props['onNavigate']
  onEdit: OnEditFn
}

function GoalCard({ goal: g, plans, onNavigate, onEdit }: GoalCardProps) {
  const deleteGoal = useStrategyStore(s => s.deleteGoal)
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
      await deleteGoal(g.id)
      setConfirmOpen(false)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Delete failed', variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const c = goalColor(g)
  const gPlans = plans.filter(p => p.goal === g.id)
  const done = gPlans.filter(p => p.done).length

  return (
    <div className="goal-card surface" style={{ '--rail': c, cursor: 'pointer' } as React.CSSProperties}
      onClick={() => onNavigate('goals', g.id)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
        <GoalDot goal={g} size={10} />
        <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{g.name}</span>
        {g.northStar && <span className="mono" style={{ fontSize: 9, color: 'var(--accent)' }}>★</span>}
        <StatusPill status={g.status} />
        <div ref={dropRef} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
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
                onClick={() => { setDropOpen(false); onEdit('goal', g.id, g) }}
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
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.5, marginBottom: 14, minHeight: 36 }}>{g.desc}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
        <Ring value={g.progress} color={c} size={50} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>metric</div>
          <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{g.metricNow} / {g.metric} {g.metricUnit}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>plans: {done}/{gPlans.length}</div>
        </div>
      </div>
      <ProgressBar value={g.progress} color={c} />
      <div style={{ height: 2 }} />
      <ConfirmDeleteModal
        open={confirmOpen}
        itemName={g.name}
        title="Delete goal"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

// ── GoalsPage ─────────────────────────────────────────────────────────────────

export function GoalsPage({ goalId, onNavigate, onEdit }: Props) {
  const { goals, plans } = useStrategyStore()

  if (goalId) return <GoalDetail goalId={goalId} onNavigate={onNavigate} />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {goals.map(g => (
        <GoalCard key={g.id} goal={g} plans={plans} onNavigate={onNavigate} onEdit={onEdit} />
      ))}
    </div>
  )
}
