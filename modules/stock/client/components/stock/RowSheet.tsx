import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, Label } from '@venator-ui/ui'
import { Economics } from './Economics'
import { NumField } from './NumField'
import { PlatformEditor } from './PlatformEditor'
import { productMetrics, useStockStore } from '@/store/stockStore'
import { fmt, pct, stamp } from '@/lib/utils'
import type { LedgerProduct } from '@/types/stock'

interface RowSheetProps {
  p: LedgerProduct
  known: string[]
  focusName: boolean
}

// Inline editor under an open row. Changes stay local until Save; sales apply at once.
export function RowSheet({ p, known, focusName }: RowSheetProps) {
  const edits         = useStockStore((s) => s.edits)
  const saving        = useStockStore((s) => s.saving)
  const editOpen      = useStockStore((s) => s.editOpen)
  const saveOpen      = useStockStore((s) => s.saveOpen)
  const cancelOpen    = useStockStore((s) => s.cancelOpen)
  const setOpenId     = useStockStore((s) => s.setOpenId)
  const sell          = useStockStore((s) => s.sell)
  const undoSale      = useStockStore((s) => s.undoSale)
  const deleteProduct = useStockStore((s) => s.deleteProduct)

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

  // What the form shows: the saved product with the pending edits on top.
  const v = useMemo((): LedgerProduct => {
    const merged = { ...p, ...edits }
    return { ...merged, metrics: productMetrics(merged) }
  }, [p, edits])

  const dirty   = Object.keys(edits).length > 0
  const named   = v.name.trim().length > 0
  const canSave = dirty && named && !saving
  const m = v.metrics

  return (
    <div
      className="stk-sheet"
      onKeyDown={(e) => {
        if (e.defaultPrevented) return
        if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement) && canSave) { e.preventDefault(); void saveOpen() }
        if (e.key === 'Escape') { e.stopPropagation(); setOpenId(null) }
      }}
    >
      <section className="stk-sh-col">
        <div className="stk-sh-h mono"><span>01</span>UNIT ECONOMICS</div>
        <Economics p={v} />
        <div className="stk-nf-pair">
          <NumField label="Unit cost (all-in)" prefix="€" step={0.5} value={v.unit_cost}  onChange={(x) => editOpen({ unit_cost: x })} />
          <NumField label="Sale price"         prefix="€" step={0.5} value={v.sale_price} onChange={(x) => editOpen({ sale_price: x })} />
        </div>
        <div className="stk-tf stk-tf-notes">
          <Label className="stk-field-lbl" htmlFor={`stk-notes-${p.id}`}>Notes</Label>
          <textarea
            id={`stk-notes-${p.id}`}
            className="stk-notes"
            rows={4}
            value={v.notes}
            onChange={(e) => editOpen({ notes: e.target.value })}
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
            value={v.name}
            error={dirty && !named}
            onChange={(e) => editOpen({ name: e.target.value })}
            placeholder="Product name"
          />
          {p.draft && <span className="stk-hint mono">new product · fill it in and save</span>}
        </div>
        <NumField label="Units available" int value={v.quantity} onChange={(x) => editOpen({ quantity: x })} />
        <div className="stk-tf">
          <Label className="stk-field-lbl">Platforms</Label>
          <PlatformEditor value={v.platforms} known={known} onChange={(x) => editOpen({ platforms: x })} />
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
          {dirty && <span className="stk-hint">unsaved changes</span>}
          {!p.draft && <span>created {stamp(p.created_at)}</span>}
          {!p.draft && <span>updated {stamp(p.updated_at)}</span>}
        </div>
        <div className="stk-sh-foot">
          {!p.draft && (
            <Button
              variant="ghost"
              size="sm"
              className={`stk-btn-del ${armed ? 'armed' : ''}`}
              onClick={() => (armed ? void deleteProduct(p.id) : setArmed(true))}
            >
              {armed ? 'Confirm delete' : 'Delete'}
            </Button>
          )}
          <div className="stk-sh-foot-r">
            <Button variant="ghost" size="sm" onClick={cancelOpen}>{dirty || p.draft ? 'Cancel' : 'Collapse'}</Button>
            <Button variant="primary" size="sm" disabled={!canSave} onClick={() => void saveOpen()}>
              {saving ? 'Saving…' : p.draft ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
