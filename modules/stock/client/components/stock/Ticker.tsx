import { useStockTotals } from '@/store/stockStore'
import { fmt0, pct } from '@/lib/utils'

// One joined instrument strip; always reflects every product, not the filters.
export function Ticker() {
  const t = useStockTotals()

  const cells = [
    { label: 'IN STOCK',      value: String(t.units),     unit: 'u', sub: `${t.products} products · ${t.soldOut} sold out` },
    { label: 'STOCK AT COST', value: fmt0(t.stockCost),             sub: 'capital tied up in units' },
    { label: 'LEFT TO EARN',  value: fmt0(t.leftToEarn),  pos: true, sub: 'if remaining stock sells at list' },
    { label: 'REVENUE',       value: fmt0(t.revenue),               sub: `${t.sold} units sold · current prices` },
    { label: 'PROFIT',        value: fmt0(t.profit),      pos: true, sub: `${t.revenue > 0 ? pct(t.profit / t.revenue) : '0%'} average margin` },
  ]

  return (
    <div className="stk-ticker">
      {cells.map((c, i) => (
        <div className="stk-tk-cell" key={c.label}>
          <div className="stk-tk-head mono">
            <span className="stk-tk-idx">{String(i + 1).padStart(2, '0')}</span>
            {c.label}
          </div>
          {/* key remount replays the flash whenever the value changes */}
          <div className={`stk-tk-value mono stk-flash ${c.pos ? 'pos' : ''}`} key={c.value}>
            {c.value}
            {c.unit && <span className="stk-tk-unit">{c.unit}</span>}
          </div>
          <div className="stk-tk-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
