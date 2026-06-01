import type { GoalStatus } from '@/types/strategy'

interface StatusPillProps {
  status: GoalStatus
}

const LABELS: Record<GoalStatus, string> = {
  active:   'active',
  'at-risk': 'at risk',
  blocked:  'blocked',
  done:     'done',
}

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={`status-pill ${status}`}>
      {LABELS[status]}
    </span>
  )
}
