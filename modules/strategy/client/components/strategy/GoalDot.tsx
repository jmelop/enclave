import type { Goal } from '@/types/strategy'
import { goalColor } from '@/lib/seed'

interface GoalDotProps {
  goal: Goal | undefined
  size?: number
  glow?: boolean
}

export function GoalDot({ goal, size = 10, glow = false }: GoalDotProps) {
  const color = goalColor(goal)
  return (
    <span
      className="dot"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: glow ? `0 0 0 3px color-mix(in oklab, ${color} 22%, transparent)` : undefined,
        display: 'inline-block',
      }}
    />
  )
}
