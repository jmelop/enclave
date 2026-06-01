import { useState } from 'react'
import { Card } from '@venator-ui/ui'
import { useStrategyStore } from '@/store/strategyStore'
import { goalColor } from '@/lib/seed'
import { GoalDot } from '@/components/strategy/GoalDot'
import { FilterBar } from '@/components/strategy/FilterBar'
import { SegControl } from '@/components/strategy/SegControl'

interface Props { goalFilter?: string; onNavigate: (view: string, goalId?: string) => void }

export function ResultsPage({ goalFilter: initial, onNavigate }: Props) {
  const { goals, retros } = useStrategyStore()
  const [goalId, setGoalId] = useState<string | null>(initial ?? null)
  const [cadence, setCadence] = useState('all')

  const filtered = [...retros]
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
        {filtered.map(r => {
          const g = goals.find(g => g.id === r.goal)
          const c = g ? goalColor(g) : 'var(--fg-4)'
          return (
            <Card key={r.id} padding="none">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 12px 18px', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c }} />
                {g && <><GoalDot goal={g} size={8} /><span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)', cursor: 'pointer' }} onClick={() => onNavigate('goals', g.id)}>{g.name}</span></>}
                <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--bg-3)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '2px 7px', color: 'var(--fg-3)' }} className="mono">
                  {r.cadence === 'weekly' ? 'weekly' : 'monthly'}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{r.period}</span>
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
        })}
        {!filtered.length && <div className="mono" style={{ padding: 32, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>No results match this filter</div>}
      </div>
    </div>
  )
}
