import { useEffect, useState } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'

function formatTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

interface TopbarProps {
  theme: string
  onTheme: () => void
}

export function Topbar({ theme, onTheme }: TopbarProps) {
  const [time, setTime] = useState(formatTime(new Date()))
  const items = useInventoryStore((s) => s.items)

  const lowCount = items.filter((i) => i.status === 'low').length
  const outCount = items.filter((i) => i.status === 'out').length
  const hasAlerts = lowCount + outCount > 0

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="topbar">
      <div className="crumbs mono">
        <span className="crumb dim">~/enclave</span>
        <span className="sep">/</span>
        <span className="crumb">inventory</span>
        <span className="crumb-blink">▊</span>
      </div>
      <div className="topbar-right">
        {hasAlerts && (
          <span className="alert-strip mono">
            <span>⚠</span>
            {outCount > 0 && <span className="alert-seg-out">{outCount} OUT</span>}
            {outCount > 0 && lowCount > 0 && <span className="alert-sep">·</span>}
            {lowCount > 0 && <span className="alert-seg-low">{lowCount} LOW</span>}
          </span>
        )}
        <span className="status-line mono">
          <span className="live-dot" /> INDEX SYNCED · {time}
        </span>
        <button className="icon-btn" onClick={onTheme} title="Toggle theme">
          {theme === 'dark' ? '◑' : '◐'}
        </button>
      </div>
    </div>
  )
}
