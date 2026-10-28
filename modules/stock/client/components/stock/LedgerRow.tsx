import { Badge, Button, Progress, TableCell, TableRow } from '@venator-ui/ui'
import { PlatformTag } from './PlatformTag'
import { fmt, parsePlatforms, pct } from '@/lib/utils'
import type { LedgerProduct } from '@/types/stock'

interface LedgerRowProps {
  p: LedgerProduct
  open: boolean
  isNew: boolean
  onToggle: () => void
  onSell: () => void
  onPlatformClick: (name: string) => void
}

const LOW_STOCK = 2

export function LedgerRow({ p, open, isNew, onToggle, onSell, onPlatformClick }: LedgerRowProps) {
  const m   = p.metrics
  const out = p.quantity === 0
  const neg = m.margin < 0
  const platforms = parsePlatforms(p.platforms)

  return (
    <TableRow
      className={`stk-row ${open ? 'open' : ''} ${out ? 'out' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onToggle() }
      }}
    >
      <TableCell className="stk-c-prod">
        <div className="stk-prod-name">
          <span className="stk-prod-id mono">#{String(p.seq).padStart(3, '0')}</span>
          <span className="stk-prod-label">{p.name || <em>Untitled product</em>}</span>
          {isNew && <Badge size="sm" pill={false} color="var(--warn)" className="stk-badge-warn mono">NEW</Badge>}
        </div>
        <div className="stk-prod-pf">
          {platforms.length > 0
            ? platforms.map((name) => (
                <PlatformTag key={name} name={name} onClick={(e) => { e.stopPropagation(); onPlatformClick(name) }} />
              ))
            : <span className="stk-pf-none mono">no platform</span>}
        </div>
      </TableCell>

      <TableCell className="stk-c-num stk-c-stock mono">
        {out
          ? <Badge size="sm" pill={false} color="var(--warn)" className="stk-badge-warn">SOLD OUT</Badge>
          : (
            <>
              <span className="n stk-flash" key={p.quantity}>{p.quantity}</span><span className="u">u</span>
              {p.quantity <= LOW_STOCK && <span className="stk-low-dot" title={`${LOW_STOCK} or fewer left`} />}
            </>
          )}
      </TableCell>

      <TableCell className="stk-c-num mono">{fmt(p.unit_cost)}</TableCell>
      <TableCell className="stk-c-num mono">{fmt(p.sale_price)}</TableCell>

      <TableCell>
        <div className="stk-mg">
          <div className="stk-mg-top mono">
            <span className={`stk-mg-eur ${neg ? 'neg' : ''}`}>{neg ? '−' : ''}{fmt(Math.abs(m.margin))}</span>
            <span className={`stk-mg-pct ${neg ? 'neg' : ''}`}>{pct(m.marginPct)}</span>
          </div>
          <Progress size="sm" value={Math.min(1, Math.abs(m.marginPct)) * 100} className={`stk-bar stk-bar-margin ${neg ? 'neg' : ''}`} />
        </div>
      </TableCell>

      <TableCell>
        <div className="stk-c-sold mono">
          <span className="n stk-flash" key={p.sales_count}>{p.sales_count}</span>
          <Progress size="sm" value={m.through * 100} className="stk-bar stk-bar-through" />
          <span className="stk-st-pct">{pct(m.through)}</span>
        </div>
      </TableCell>

      <TableCell className="stk-c-act">
        <Button
          variant="outline"
          size="sm"
          className="stk-sell-btn mono"
          disabled={out || p.draft}
          title={p.draft ? 'Name it first' : out ? 'No stock left' : 'Record one sale'}
          onClick={(e) => { e.stopPropagation(); onSell() }}
        >
          Sell 1
        </Button>
      </TableCell>
    </TableRow>
  )
}
