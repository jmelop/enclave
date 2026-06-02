import { useState } from 'react'
import { Card, Checkbox, Badge, Button } from '@venator-ui/ui'
import { Plus } from 'lucide-react'
import { useStrategyStore } from '@/store/strategyStore'
import { goalColor } from '@/lib/seed'
import { GoalDot } from '@/components/strategy/GoalDot'
import { FilterBar } from '@/components/strategy/FilterBar'
import { SegControl } from '@/components/strategy/SegControl'
import { DueChip } from '@/components/strategy/DueChip'

interface Props { goalFilter?: string; onNavigate: (view: string, goalId?: string) => void }

export function PlansPage({ goalFilter: initial, onNavigate }: Props) {
  const { goals, plans, togglePlan } = useStrategyStore()
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
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 160px 80px 120px', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-2)' }}>
          {['', 'Action step', 'Goal', 'Horizon', 'Due'].map((h, i) => (
            <span key={i} className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', letterSpacing: '0.1em' }}>{h}</span>
          ))}
        </div>
        {filtered.map(p => {
          const g = goals.find(g => g.id === p.goal)
          const c = g ? goalColor(g) : 'var(--fg-4)'
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 160px 80px 120px', gap: 12, alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <Checkbox checked={p.done} onCheckedChange={() => togglePlan(p.id)} />
              <span style={{ fontSize: 13, color: p.done ? 'var(--fg-4)' : 'var(--fg)', textDecoration: p.done ? 'line-through' : 'none' }}>{p.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: 'var(--fg-3)', fontSize: 12 }} onClick={() => onNavigate('goals', g?.id)}>
                {g && <GoalDot goal={g} size={7} />}
                {g?.name}
              </div>
              <Badge size="sm" variant="default">{p.horizon}</Badge>
              <DueChip iso={p.due} />
            </div>
          )
        })}
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
