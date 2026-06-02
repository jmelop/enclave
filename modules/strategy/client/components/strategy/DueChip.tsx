import { daysLeft, fmtDate } from '@/lib/seed'

interface DueChipProps {
  iso: string
}

export function DueChip({ iso }: DueChipProps) {
  const days = daysLeft(iso)
  const label = fmtDate(iso)

  let color: string
  if (days < 0) color = 'var(--danger)'
  else if (days <= 7) color = 'var(--warn)'
  else color = 'var(--fg-4)'

  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5,
        color,
        padding: '2px 7px',
        border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
        borderRadius: 999,
        background: `color-mix(in oklab, ${color} 10%, transparent)`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
