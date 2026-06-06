import { Card } from '@venator-ui/ui'
import { StatCard } from '@venator-ui/patterns'
import { Checkbox } from '@venator-ui/ui'
import { useStrategyStore } from '@/store/strategyStore'
import { goalColor } from '@/lib/seed'
import { GoalDot } from '@/components/strategy/GoalDot'
import { StatusPill } from '@/components/strategy/StatusPill'
import { Ring } from '@/components/strategy/Ring'
import { DueChip } from '@/components/strategy/DueChip'

interface Props { onNavigate: (view: string, goalId?: string) => void }

export function OverviewPage({ onNavigate }: Props) {
  const { goals, plans, results, intel, togglePlan } = useStrategyStore()

  const activeGoals = goals.filter(g => g.status !== 'done').length
  const atRisk = goals.filter(g => g.status === 'at-risk').length
  const weekPlans = plans.filter(p => p.horizon === 'week')
  const weekDone = weekPlans.filter(p => p.done).length
  const avgProgress = Math.round(goals.reduce((s, g) => s + g.progress, 0) / (goals.length || 1))
  const experiments = intel.filter(it => it.type === 'result')
  const wins = experiments.filter(it => it.verdict === 'win').length
  const winRate = experiments.length ? Math.round((wins / experiments.length) * 100) : 0

  const recentResults = [...results].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const recentIntel = [...intel].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3.5">
        <StatCard title="Active Goals" value={activeGoals} description={atRisk ? `${atRisk} at risk` : 'all on track'} variant={atRisk ? 'warning' : 'success'} />
        <StatCard title="Week focus" value={`${weekDone}/${weekPlans.length}`} description="plans closed" />
        <StatCard title="Avg progress" value={`${avgProgress}%`} description="across all goals" />
        <StatCard title="Win rate" value={`${winRate}%`} description={`${wins}/${experiments.length} experiments`} variant={winRate >= 50 ? 'success' : 'warning'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        {/* Goals section */}
        <Card padding="none">
          <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Goals</h3>
            <button style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => onNavigate('goals')}>
              View all →
            </button>
          </div>
          <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {goals.map(g => {
              const c = goalColor(g)
              const next = plans.find(p => p.goal === g.id && !p.done)
              return (
                <div key={g.id} className="goal-row surface" style={{ '--rail': c } as React.CSSProperties}
                  onClick={() => onNavigate('goals', g.id)}>
                  <Ring value={g.progress} color={c} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <GoalDot goal={g} size={8} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</span>
                      {g.northStar && <span className="mono" style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.08em' }}>★ NORTH STAR</span>}
                      <span className="mono" style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: c }}>{g.progress}%</span>
                    </div>
                    <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fg-4)', flexWrap: 'wrap' }}>
                      <span>{g.metricNow} / {g.metric} {g.metricUnit}</span>
                      <span style={{ color: 'var(--fg-5)' }}>·</span>
                      <DueChip iso={g.due} />
                      {next && <><span style={{ color: 'var(--fg-5)' }}>·</span><span style={{ color: 'var(--fg-3)' }}>▶ {next.title}</span></>}
                    </div>
                  </div>
                  <StatusPill status={g.status} />
                </div>
              )
            })}
          </div>
        </Card>

        {/* Right panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Week focus */}
          <Card padding="none">
            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 600 }}>
              Week focus · {weekDone}/{weekPlans.length}
            </div>
            <div style={{ padding: '6px 8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {weekPlans.slice(0, 6).map(p => {
                const g = goals.find(g => g.id === p.goal)
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 8 }}>
                    <Checkbox checked={p.done} onCheckedChange={() => togglePlan(p.id)} />
                    <span style={{ flex: 1, fontSize: 12.5, color: p.done ? 'var(--fg-4)' : 'var(--fg)', textDecoration: p.done ? 'line-through' : 'none' }}>{p.title}</span>
                    {g && <GoalDot goal={g} size={7} />}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Recent changes */}
          <Card padding="none">
            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 600 }}>
              Recent changes
            </div>
            <div style={{ padding: '6px 8px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentResults.map(r => {
                const g = goals.find(g => g.id === r.goal)
                const c = g ? goalColor(g) : 'var(--fg-4)'
                return (
                  <div key={r.id} style={{ display: 'flex', gap: 10, padding: '8px', borderRadius: 8, cursor: 'pointer' }} onClick={() => onNavigate('results')}>
                    <div style={{ width: 3, borderRadius: 3, flexShrink: 0, background: c }} />
                    <div>
                      <div style={{ fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.4 }}>{r.change}</div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 3 }}>{g?.name} · {r.period}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Signals */}
          <Card padding="none">
            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 600 }}>
              Signals
            </div>
            <div style={{ padding: '6px 8px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentIntel.map(it => {
                const g = goals.find(g => g.id === it.goal)
                return (
                  <div key={it.id} style={{ display: 'flex', gap: 10, padding: '8px', borderRadius: 8, cursor: 'pointer' }} onClick={() => onNavigate('intel')}>
                    <div style={{ width: 28, flexShrink: 0, fontSize: 11, color: 'var(--fg-4)' }}>{it.type === 'note' ? '📝' : '🧪'}</div>
                    <div>
                      <div style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 500 }}>{it.title}</div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 2 }}>{it.type} · {g?.name}</div>
                    </div>
                    {it.type === 'result' && (
                      <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: it.verdict === 'win' ? 'var(--success)' : 'var(--danger)' }}>
                        {it.verdict === 'win' ? '✓' : '✗'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
