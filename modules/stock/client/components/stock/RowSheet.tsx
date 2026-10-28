import { useEffect, useRef, useState } from 'react'
import { Button, Input, Label } from '@venator-ui/ui'
import { Economics } from './Economics'
import { NumField } from './NumField'
import { PlatformEditor } from './PlatformEditor'
import { useStockStore } from '@/store/stockStore'
import { fmt, pct, stamp } from '@/lib/utils'
import type { LedgerProduct } from '@/types/stock'

interface RowSheetProps {
  p: LedgerProduct
  known: string[]
  focusName: boolean
}

// Inline editor under an open row. Every change saves itself (debounced in the store).
export function RowSheet({ p, known, focusName }: RowSheetProps) {
  const patch         = useStockStore((s) => s.patchProduct)
  const sell          = useStockStore((s) => s.sell)
  const undoSale      = useStockStore((s) => s.undoSale)
  const deleteProduct = useStockStore((s) => s.deleteProduct)
  const setOpenId     = useStockStore((s) => s.setOpenId)

  const nameRef = useRef<HTMLInputElement>(null)
  const [armed, setArmed] = useState(false)   // first Delete click arms, second deletes

  useEffect(() => {
    if (focusName && nameRef.current) { nameRef.current.focus(); nameRef.current.select() }
  }, [focusName])

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  const m = p.metrics
  const set = (changes: Parameters<typeof patch>[1]) => patch(p.id, changes)

  return (
    <div className="stk-sheet">
      <section className="stk-sh-col">
        <div className="stk-sh-h mono"><span>01</span>UNIT ECONOMICS</div>
        <Economics p={p} />
        <div className="stk-nf-pair">
          <NumField label="Unit cost (all-in)" prefix="€" step={0.5} value={p.unit_cost}  onChange={(v) => set({ unit_cost: v })} />
          <NumField label="Sale price"         prefix="€" step={0.5} value={p.sale_price} onChange={(v) => set({ sale_price: v })} />
        </div>
        <div className="stk-tf stk-tf-notes">
          <Label className="stk-field-lbl" htmlFor={`stk-notes-${p.id}`}>Notes</Label>
          <textarea
            id={`stk-notes-${p.id}`}
            className="stk-notes"
            rows={4}
            value={p.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Optional · materials, print settings, buyer notes…"
          />
        </div>
      </section>

      <section className="stk-sh-col">
        <div className="stk-sh-h mono"><span>02</span>LISTING</div>
        <div className="stk-tf">
          <Label className="stk-field-lbl" htmlFor={`stk-name-${p.id}`}>Name</Label>
          <Input
            id={`stk-name-${p.id}`}
            ref={nameRef}
            size="sm"
            value={p.name}
            error={!p.draft && !p.name.trim()}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Product name"
          />
          {p.draft && <span className="stk-hint mono">not saved yet · type a name to create it</span>}
        </div>
        <NumField label="Units available" int value={p.quantity} onChange={(v) => set({ quantity: v })} />
        <div className="stk-tf">
          <Label className="stk-field-lbl">Platforms</Label>
          <PlatformEditor value={p.platforms} known={known} onChange={(v) => set({ platforms: v })} />
        </div>
      </section>

      <section className="stk-sh-col">
        <div className="stk-sh-h mono"><span>03</span>SALES</div>
        <div className="stk-sales-big">
          <span className="stk-sales-n mono stk-flash" key={p.sales_count}>{p.sales_count}</span>
          <span className="stk-sales-u mono">units sold</span>
        </div>
        <div className="stk-sales-actions">
          <Button variant="primary" size="sm" disabled={p.draft || p.quantity === 0} onClick={() => void sell(p.id)}>Record sale</Button>
          <Button variant="ghost" size="sm" disabled={p.draft || p.sales_count === 0} onClick={() => void undoSale(p.id)}>Undo</Button>
        </div>
        <dl className="stk-sales-dl">
          <div><dt>Revenue</dt><dd>{fmt(m.revenue)}</dd></div>
          <div><dt>Profit</dt><dd className={m.profit < 0 ? 'neg' : 'pos'}>{m.profit < 0 ? '−' : ''}{fmt(Math.abs(m.profit))}</dd></div>
          <div><dt>Left to earn</dt><dd>{fmt(m.leftToEarn)}</dd></div>
          <div><dt>Sell-through</dt><dd>{pct(m.through)}</dd></div>
        </dl>
        <div className="stk-sh-meta mono">
          <span>created {stamp(p.created_at)}</span>
          <span>updated {stamp(p.updated_at)}</span>
        </div>
        <div className="stk-sh-foot">
          <Button
            variant="ghost"
            size="sm"
            className={`stk-btn-del ${armed ? 'armed' : ''}`}
            onClick={() => (armed ? void deleteProduct(p.id) : setArmed(true))}
          >
            {armed ? 'Confirm delete' : 'Delete'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpenId(null)}>Collapse</Button>
        </div>
      </section>
    </div>
  )
}
