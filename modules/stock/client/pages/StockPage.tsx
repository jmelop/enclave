import { Ticker } from '@/components/stock/Ticker'
import { Toolbar } from '@/components/stock/Toolbar'
import { Ledger } from '@/components/stock/Ledger'
import { useLedgerRows, useStockStore } from '@/store/stockStore'

export function StockPage() {
  const total = useStockStore((s) => s.products.length)
  const rows  = useLedgerRows()

  return (
    <>
      <Ticker />

      <Toolbar matches={rows.length} />

      <Ledger rows={rows} />

      <footer className="stk-page-foot mono">
        <span>END · {rows.length} / {total} products</span>
        <span className="dim">enclave/stock · build 2026.10</span>
      </footer>
    </>
  )
}
