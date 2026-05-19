import type { ItemStatus } from '@/types/inventory'

const STATUS_MAP = {
  in:  { label: 'In Stock',     short: 'IN',  token: 'var(--success)' },
  low: { label: 'Low',          short: 'LOW', token: 'var(--warn)' },
  out: { label: 'Out of Stock', short: 'OUT', token: 'var(--danger)' },
}

interface StatusPillProps {
  status: ItemStatus
  micro?: boolean
}

export function StatusPill({ status, micro }: StatusPillProps) {
  const s = STATUS_MAP[status]
  return (
    <span className="status-pill" style={{ color: s.token }}>
      <span
        className="status-dot"
        style={{
          background: s.token,
          boxShadow: `0 0 0 3px color-mix(in oklab, ${s.token} 18%, transparent)`,
        }}
      />
      {micro ? s.short : s.label}
    </span>
  )
}
