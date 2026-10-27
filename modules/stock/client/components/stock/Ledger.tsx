import { Fragment } from 'react'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@venator-ui/ui'
import { LedgerRow } from './LedgerRow'
import { RowSheet } from './RowSheet'
import { sumProducts, usePlatforms, useStockStore } from '@/store/stockStore'
import { fmt0 } from '@/lib/utils'
import type { LedgerProduct, SortKey } from '@/types/stock'

const COLUMNS: { key: SortKey | null; label: string; num?: boolean; width?: number }[] = [
  { key: 'name',        label: 'PRODUCT' },
  { key: 'quantity',    label: 'STOCK',          num: true, width: 94  },
  { key: 'unit_cost',   label: 'UNIT COST',      num: true, width: 106 },
  { key: 'sale_price',  label: 'PRICE',          num: true, width: 106 },
  { key: 'margin',      label: 'MARGIN',                    width: 154 },
  { key: 'sales_count', label: 'SOLD · THROUGH',            width: 138 },
  { key: null,          label: '',                          width: 96  },
]

export function Ledger({ rows }: { rows: LedgerProduct[] }) {
  const openId          = useStockStore((s) => s.openId)
  const focusId         = useStockStore((s) => s.focusId)
  const newIds          = useStockStore((s) => s.newIds)
  const rowKeys         = useStockStore((s) => s.rowKeys)
  const sortBy          = useStockStore((s) => s.sortBy)
  const sortDir         = useStockStore((s) => s.sortDir)
  const setSortBy       = useStockStore((s) => s.setSortBy)
  const toggleOpen      = useStockStore((s) => s.toggleOpen)
  const sell            = useStockStore((s) => s.sell)
  const setPlatformFilter = useStockStore((s) => s.setPlatformFilter)
  const known = usePlatforms().map(([name]) => name)

  const totals = sumProducts(rows)

  return (
    <div className="stk-ledger">
      <Table className="stk-table">
        <colgroup>
          {COLUMNS.map((c) => <col key={c.label || 'act'} style={c.width ? { width: c.width } : undefined} />)}
        </colgroup>
        <TableHeader>
          <TableRow className="stk-head-row">
            {COLUMNS.map((c) => {
              const active = c.key !== null && sortBy === c.key
              return (
                <TableHead
                  key={c.label || 'act'}
                  className="stk-th"
                  aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {c.key && (
                    <button
                      type="button"
                      className={`stk-th-btn mono ${c.num ? 'num' : ''} ${active ? 'on' : ''}`}
                      onClick={() => setSortBy(c.key!)}
                    >
                      {c.label}
                      {active && <span className="stk-th-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 && (
            <TableRow className="stk-empty-row">
              <TableCell colSpan={COLUMNS.length}>
                <div className="stk-empty">
                  <div className="stk-empty-mark mono">/dev/null</div>
                  <div className="stk-empty-text">No products match.</div>
                  <div className="stk-empty-sub mono">clear filters · or press N to add one</div>
                </div>
              </TableCell>
            </TableRow>
          )}
          {rows.map((p) => {
            const open = openId === p.id
            return (
              <Fragment key={rowKeys[p.id] ?? p.id}>
                <LedgerRow
                  p={p}
                  open={open}
                  isNew={newIds.includes(p.id)}
                  onToggle={() => toggleOpen(p.id)}
                  onSell={() => void sell(p.id)}
                  onPlatformClick={setPlatformFilter}
                />
                {open && (
                  <TableRow className="stk-sheet-row">
                    <TableCell colSpan={COLUMNS.length} className="stk-sheet-cell">
                      <RowSheet p={p} known={known} focusName={focusId === p.id} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>

        {rows.length > 0 && (
          <TableFooter className="stk-total mono">
            <TableRow>
              <TableCell>TOTAL · {totals.products} products</TableCell>
              <TableCell className="stk-c-num">{totals.units}u</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="pos">{fmt0(totals.leftToEarn)} left</TableCell>
              <TableCell>{totals.sold} sold</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  )
}
