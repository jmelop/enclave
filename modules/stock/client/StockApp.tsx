// Content-only component: topbar + hero + routing.
//   • standalone: App.tsx wraps it with the sidebar shell
//   • dashboard:  client.config.tsx routes expose this directly
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Button, Kbd, useToast } from '@venator-ui/ui'
import { StockPage } from '@/pages/StockPage'
import { useStockStore, useStockTotals } from '@/store/stockStore'
import type { StockProduct } from '@/types/stock'

function formatTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const CSV_COLUMNS: (keyof StockProduct)[] = ['id', 'name', 'quantity', 'unit_cost', 'sale_price', 'platforms', 'sales_count', 'created_at', 'updated_at']

function exportCsv(products: StockProduct[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [CSV_COLUMNS.join(','), ...products.map((p) => CSV_COLUMNS.map((k) => esc(p[k])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = 'stock_products.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)

export default function StockApp() {
  const { toast }      = useToast()
  const products       = useStockStore((s) => s.products)
  const draftIds       = useStockStore((s) => s.draftIds)
  const hydrated       = useStockStore((s) => s.hydrated)
  const loading        = useStockStore((s) => s.loading)
  const error          = useStockStore((s) => s.error)
  const saveError      = useStockStore((s) => s.saveError)
  const hydrate        = useStockStore((s) => s.hydrate)
  const refetch        = useStockStore((s) => s.refetch)
  const addProduct     = useStockStore((s) => s.addProduct)
  const setOpenId      = useStockStore((s) => s.setOpenId)
  const clearSaveError = useStockStore((s) => s.clearSaveError)
  const totals         = useStockTotals()

  const [time, setTime]   = useState(() => formatTime(new Date()))
  const [theme, setTheme] = useState<string>(() =>
    document.documentElement.getAttribute('data-theme') ?? 'dark'
  )

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!saveError) return
    toast({ title: 'Could not save', description: saveError, variant: 'error' })
    clearSaveError()
  }, [saveError, toast, clearSaveError])

  // N → new product, Esc → collapse (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); addProduct() }
      if (e.key === 'Escape') setOpenId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [addProduct, setOpenId])

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('enclave-theme', next)
      return next
    })
  }

  const renderBody = () => {
    if (loading && !hydrated) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>
          Loading stock…
        </div>
      )
    }
    if (error && !hydrated) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
          <span style={{ color: 'var(--danger)' }}>Failed to load stock: {error}</span>
          <Button variant="accent" size="sm" onClick={() => void refetch()}>Retry</Button>
        </div>
      )
    }
    return (
      <Routes>
        <Route path="*" element={<StockPage />} />
      </Routes>
    )
  }

  return (
    <div className="stk-canvas with-grid">
      <div className="stk-topbar mono">
        <span className="crumb dim">~/enclave</span>
        <span className="sep">/</span>
        <span className="crumb">stock</span>
        <span className="stk-cursor">▍</span>
        <span className="spacer" />
        {hydrated && totals.soldOut + totals.belowCost > 0 && (
          <span className="stk-alert-strip">
            <span>⚠</span>
            {totals.soldOut > 0 && <span className="stk-alert-low">{totals.soldOut} SOLD OUT</span>}
            {totals.soldOut > 0 && totals.belowCost > 0 && <span className="stk-alert-sep">·</span>}
            {totals.belowCost > 0 && <span className="stk-alert-out">{totals.belowCost} BELOW COST</span>}
          </span>
        )}
        <span className="stk-status"><span className="stk-live-dot" />LEDGER SYNCED · {time}</span>
        <button
          type="button"
          className="stk-icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="3.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M11.8 3.2l-1 1M4.2 11.8l-1 1"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z"/>
            </svg>
          )}
        </button>
      </div>

      <header className="stk-hero">
        <div className="stk-hero-tag mono">// MODULE · enclave-stock</div>
        <div className="stk-hero-row">
          <h1 className="stk-hero-title">
            Stock<span className="stk-hero-dot">.</span>
          </h1>
          <div className="stk-hero-actions">
            <Button
              variant="ghost"
              size="sm"
              className="stk-hero-btn"
              disabled={!hydrated}
              onClick={() => exportCsv(products.filter((p) => !draftIds.includes(p.id)))}
            >
              ↓ Export CSV
            </Button>
            <Button variant="primary" size="sm" className="stk-hero-btn" disabled={!hydrated} onClick={addProduct}>
              + New product <Kbd className="stk-kbd">N</Kbd>
            </Button>
          </div>
        </div>
        <div className="stk-hero-sub">Products for sale: units on hand, unit economics and sales per platform.</div>
      </header>

      {renderBody()}
    </div>
  )
}
