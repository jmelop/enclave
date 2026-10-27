import type { CSSProperties, MouseEvent } from 'react'
import { hueFor } from '@/lib/utils'

interface PlatformTagProps {
  name: string
  onClick?: (e: MouseEvent<HTMLElement>) => void
  onRemove?: () => void
}

export function PlatformTag({ name, onClick, onRemove }: PlatformTagProps) {
  const style = { '--h': hueFor(name) } as CSSProperties
  return (
    <span className={`stk-pf-tag ${onClick ? 'clickable' : ''}`} style={style} onClick={onClick}>
      <span className="stk-pf-dot" />
      {name}
      {onRemove && (
        <button
          type="button"
          className="stk-pf-x"
          aria-label={`Remove ${name}`}
          onClick={(e) => { e.stopPropagation(); onRemove() }}
        >
          ×
        </button>
      )}
    </span>
  )
}
