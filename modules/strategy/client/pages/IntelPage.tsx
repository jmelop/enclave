import { useState } from 'react'
import { Card, Badge } from '@venator-ui/ui'
import { useStrategyStore } from '@/store/strategyStore'
import { goalColor, fmtDate } from '@/lib/seed'
import { GoalDot } from '@/components/strategy/GoalDot'
import { FilterBar } from '@/components/strategy/FilterBar'
import { SegControl } from '@/components/strategy/SegControl'

interface Props { goalFilter?: string; onNavigate: (view: string, goalId?: string) => void }

export function IntelPage({ goalFilter: initial, onNavigate }: Props) {
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
        {filtered.map(it => {
          const g = goals.find(g => g.id === it.goal)
          const c = g ? goalColor(g) : 'var(--fg-4)'
          return (
            <Card key={it.id} padding="none">
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
        })}
        {!filtered.length && <div className="mono" style={{ padding: 32, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>No intel match this filter</div>}
      </div>
    </div>
  )
}
