import type { ReactNode } from 'react'
import type { Goal } from '@/types/strategy'
import { goalColor } from '@/lib/seed'

interface FilterBarProps {
  goals: Goal[]
  value: string | null
  onChange: (id: string | null) => void
  extra?: ReactNode
}

export function FilterBar({ goals, value, onChange, extra }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <button
        className={`filter-chip${value === null ? ' active' : ''}`}
        onClick={() => onChange(null)}
      >
        All goals
      </button>
      {goals.map(g => (
        <button
          key={g.id}
          className={`filter-chip${value === g.id ? ' active' : ''}`}
          onClick={() => onChange(g.id)}
        >
          <span
            className="dot"
            style={{ width: 7, height: 7, background: goalColor(g), display: 'inline-block' }}
          />
          {g.name}
        </button>
      ))}
      {extra}
    </div>
  )
}
