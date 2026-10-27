import { fmt, pct } from '@/lib/utils'
import type { LedgerProduct } from '@/types/stock'

// Price split into cost (hatched) + margin (green), or price + loss (red) when below cost.
export function Economics({ p }: { p: LedgerProduct }) {
  const { margin, marginPct } = p.metrics
  const neg   = margin < 0
  const max   = Math.max(p.sale_price, p.unit_cost, 0.01)
  const baseW = (Math.min(p.unit_cost, p.sale_price) / max) * 100
  const restW = (Math.abs(margin) / max) * 100

  return (
    <div className="stk-econ">
      <div className="stk-econ-bar">
        <div className="stk-econ-cost" style={{ width: `${baseW}%` }} />
        <div className={`stk-econ-margin ${neg ? 'neg' : ''}`} style={{ width: `${restW}%` }} />
      </div>
      <div className="stk-econ-legend mono">
        <span><i className="stk-sw stk-sw-cost" />{neg ? 'Price' : 'Cost'} {fmt(neg ? p.sale_price : p.unit_cost)}</span>
        <span><i className={`stk-sw ${neg ? 'stk-sw-neg' : 'stk-sw-margin'}`} />{neg ? 'Loss' : 'Margin'} {fmt(Math.abs(margin))} · {pct(marginPct)}</span>
        <span className="stk-econ-total">{neg ? 'Cost' : 'Price'} {fmt(neg ? p.unit_cost : p.sale_price)}</span>
      </div>
    </div>
  )
}
