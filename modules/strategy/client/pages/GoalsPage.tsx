import { Card } from '@venator-ui/ui'
import { Button } from '@venator-ui/ui'
import { ChevronLeft } from 'lucide-react'
import { useStrategyStore } from '@/store/strategyStore'
import { goalColor, fmtDate, daysLeft } from '@/lib/seed'
import { GoalDot } from '@/components/strategy/GoalDot'
import { StatusPill } from '@/components/strategy/StatusPill'
import { Ring } from '@/components/strategy/Ring'
import { ProgressBar } from '@/components/strategy/ProgressBar'
import { Checkbox } from '@venator-ui/ui'
import { Badge } from '@venator-ui/ui'

interface Props {
  goalId?: string
  onNavigate: (view: string, goalId?: string) => void
}

function GoalDetail({ goalId, onNavigate }: { goalId: string; onNavigate: Props['onNavigate'] }) {
  const { goals, plans, retros, intel, togglePlan } = useStrategyStore()
  const g = goals.find(x => x.id === goalId)
  if (!g) return null

  const c = goalColor(g)
  const gPlans = plans.filter(p => p.goal === g.id)
  const gRetros = retros.filter(r => r.goal === g.id)
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

      {/* Trail: plans / retros / intel */}
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
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{gRetros.length}</span>
          </div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gRetros.map(r => (
              <div key={r.id} style={{ padding: '10px 10px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)' }}>{r.period}</div>
                <div style={{ fontSize: 12, color: 'var(--success)' }}>+ {r.good}</div>
                <div style={{ fontSize: 12, color: 'var(--danger)' }}>− {r.bad}</div>
                <div style={{ fontSize: 12, color: c, fontWeight: 500 }}>→ {r.change}</div>
              </div>
            ))}
            {!gRetros.length && <div className="mono" style={{ padding: 12, color: 'var(--fg-5)', fontSize: 11 }}>No results yet</div>}
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

export function GoalsPage({ goalId, onNavigate }: Props) {
  const { goals, plans } = useStrategyStore()

  if (goalId) return <GoalDetail goalId={goalId} onNavigate={onNavigate} />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {goals.map(g => {
        const c = goalColor(g)
        const gPlans = plans.filter(p => p.goal === g.id)
        const done = gPlans.filter(p => p.done).length
        return (
          <div key={g.id} className="goal-card surface" style={{ '--rail': c, cursor: 'pointer' } as React.CSSProperties}
            onClick={() => onNavigate('goals', g.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <GoalDot goal={g} size={10} />
              <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{g.name}</span>
              {g.northStar && <span className="mono" style={{ fontSize: 9, color: 'var(--accent)' }}>★</span>}
              <StatusPill status={g.status} />
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
          </div>
        )
      })}
    </div>
  )
}
