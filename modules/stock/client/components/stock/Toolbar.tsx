import type { CSSProperties } from 'react'
import { Input } from '@venator-ui/ui'
import { usePlatforms, useStockStore } from '@/store/stockStore'
import { hueFor } from '@/lib/utils'
import type { StockFilter } from '@/types/stock'

const STOCK_OPTS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'ALL'      },
  { value: 'in',  label: 'IN STOCK' },
  { value: 'out', label: 'SOLD OUT' },
]

export function Toolbar({ matches }: { matches: number }) {
  const query             = useStockStore((s) => s.query)
  const platformFilter    = useStockStore((s) => s.platformFilter)
  const stockFilter       = useStockStore((s) => s.stockFilter)
  const setQuery          = useStockStore((s) => s.setQuery)
  const setPlatformFilter = useStockStore((s) => s.setPlatformFilter)
  const setStockFilter    = useStockStore((s) => s.setStockFilter)
  const platforms         = usePlatforms()

  return (
    <div className="stk-toolbar">
      <div className="stk-search">
        <Input
          className="mono"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="grep products or platforms…"
          leftIcon={<span className="stk-prompt mono">$</span>}
          rightIcon={<span className="stk-search-meta mono">{matches} rows</span>}
        />
      </div>

      <div className="stk-tb-row">
        <div className="stk-chip-row">
          <button
            type="button"
            className={`stk-chip ${platformFilter === null ? 'sel' : ''}`}
            onClick={() => setPlatformFilter(null)}
          >
            <span className="stk-chip-dot" style={{ background: 'var(--fg-2)' }} />
            All platforms
          </button>
          {platforms.map(([name, count]) => {
            const sel = platformFilter === name
            return (
              <button
                type="button"
                key={name}
                className={`stk-chip ${sel ? 'sel' : ''}`}
                style={{ '--h': hueFor(name) } as CSSProperties}
                onClick={() => setPlatformFilter(sel ? null : name)}
              >
                <span className="stk-chip-dot stk-pf-chipdot" />
                {name}
                <span className="stk-chip-count mono">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="stk-seg">
          {STOCK_OPTS.map((o) => (
            <button
              type="button"
              key={o.value}
              className={`stk-seg-opt mono ${stockFilter === o.value ? 'sel' : ''}`}
              onClick={() => setStockFilter(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
