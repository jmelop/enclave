import { Badge } from '@venator-ui/ui'
import type { ItemStatus } from '@/types/inventory'

const STATUS_MAP = {
  in:  { variant: 'success' as const, label: 'In Stock',     short: 'IN'  },
  low: { variant: 'warning' as const, label: 'Low',          short: 'LOW' },
  out: { variant: 'error'   as const, label: 'Out of Stock', short: 'OUT' },
}

interface StatusPillProps {
  status: ItemStatus
  micro?: boolean
}

export function StatusPill({ status, micro }: StatusPillProps) {
  const s = STATUS_MAP[status]
  return (
    <Badge variant={s.variant} dot size={micro ? 'sm' : 'md'}>
      {micro ? s.short : s.label}
    </Badge>
  )
}
