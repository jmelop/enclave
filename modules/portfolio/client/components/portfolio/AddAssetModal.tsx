import { useState, useEffect } from 'react'
import { useToast } from '@venator-ui/ui'
import { CATEGORIES } from '../../lib/utils'
import type { Asset, AssetCategory } from '../../types/portfolio'

const SUBTYPES = {
  collectible: [
    { value: 'gold', label: 'Gold' }, { value: 'silver', label: 'Silver' },
    { value: 'jewelry', label: 'Jewelry' }, { value: 'watch', label: 'Watches' },
    { value: 'art', label: 'Art' }, { value: 'other', label: 'Other' },
  ],
  investment: [
    { value: 'startup', label: 'Startup / SAFE' }, { value: 'p2p', label: 'P2P lending' },
    { value: 'vc', label: 'Venture fund' }, { value: 'roboadvisor', label: 'Robo-advisor' },
    { value: 'other', label: 'Other' },
  ],
  realestate: [
    { value: 'direct', label: 'Direct property' },
    { value: 'family', label: 'Family participation' },
    { value: 'reit', label: 'REIT / SCPI' },
  ],
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF']

const KNOWN: Record<string, { name: string; price: number; currency: string; type: AssetCategory; isin?: string; ter?: number; distribution?: 'Acc' | 'Dist' }> = {
  BTC:  { name: 'Bitcoin',                 price: 43250.75, currency: 'USD', type: 'crypto' },
  ETH:  { name: 'Ethereum',                price: 2580.90,  currency: 'USD', type: 'crypto' },
  SOL:  { name: 'Solana',                  price: 145.20,   currency: 'USD', type: 'crypto' },
  ADA:  { name: 'Cardano',                 price: 0.62,     currency: 'USD', type: 'crypto' },
  AAPL: { name: 'Apple Inc.',              price: 187.42,   currency: 'USD', type: 'stock' },
  NVDA: { name: 'NVIDIA Corporation',      price: 875.20,   currency: 'USD', type: 'stock' },
  ASML: { name: 'ASML Holding',            price: 720.40,   currency: 'EUR', type: 'stock' },
  VWCE: { name: 'Vanguard FTSE All-World', price: 118.30,   currency: 'EUR', type: 'fund', isin: 'IE00BK5BQT80', ter: 0.22, distribution: 'Acc' },
  IWDA: { name: 'iShares Core MSCI World', price: 89.60,    currency: 'EUR', type: 'fund', isin: 'IE00B4L5Y983', ter: 0.20, distribution: 'Acc' },
}

const TYPE_TABS: { id: AssetCategory; label: string; hint: string }[] = [
  { id: 'stock',       label: 'Stocks',       hint: 'auto feed' },
  { id: 'fund',        label: 'Funds / ETF',  hint: 'isin · ter' },
  { id: 'investment',  label: 'Alt. Invest.',  hint: 'free-form' },
  { id: 'savings',     label: 'Savings',       hint: 'bank' },
  { id: 'realestate',  label: 'Real Estate',   hint: 'manual val.' },
  { id: 'collectible', label: 'Collectibles',  hint: 'physical' },
  { id: 'crypto',      label: 'Crypto',        hint: 'auto feed' },
]

interface Props {
  onClose: () => void
  onAdd: (asset: Asset) => void
  defaultCategory?: AssetCategory
}

interface FormState {
  currency: string
  name?: string
  symbol?: string
  price?: string
  quantity?: string
  amount?: string
  isin?: string
  ter?: string
  distribution?: string
  bank?: string
  apy?: string
  subtype?: string
  valuationDate?: string
  description?: string
}

function PillRow({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="v-pillrow">
      {options.map(o => (
        <button key={o.value} type="button" className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function CurrencyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="v-currency">
      {CURRENCIES.map(c => (
        <button key={c} type="button" className={value === c ? 'on' : ''} onClick={() => onChange(c)}>{c}</button>
      ))}
    </div>
  )
}

function MoneyInput({ value, onChange, placeholder = '0.00', currency = 'EUR' }: { value: string; onChange: (v: string) => void; placeholder?: string; currency?: string }) {
  return (
    <div className="v-input-wrap">
      <input className="v-input p-mono" placeholder={placeholder} inputMode="decimal"
             value={value} onChange={e => onChange(e.target.value)} />
      <div className="v-input-suffix">{currency}</div>
    </div>
  )
}

export default function AddAssetModal({ onClose, onAdd, defaultCategory }: Props) {
  const { toast } = useToast()
  const [type, setType] = useState<AssetCategory>(defaultCategory ?? 'stock')
  const [form, setForm] = useState<FormState>({ currency: 'EUR' })
  const [validated, setValidated] = useState<'ok' | 'err' | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  const switchType = (t: AssetCategory) => {
    setType(t)
    setForm({ currency: 'EUR' })
    setValidated(null)
  }

  const validate = () => {
    const k = (form.symbol ?? '').trim().toUpperCase()
    const hit = KNOWN[k]
    if (hit) {
      if (hit.type !== type) setType(hit.type)
      setForm(f => ({
        ...f,
        symbol: k,
        name: hit.name,
        price: String(hit.price),
        currency: hit.currency,
        isin: hit.isin ?? f.isin,
        ter: hit.ter != null ? String(hit.ter) : f.ter,
        distribution: hit.distribution ?? f.distribution,
      }))
      setValidated('ok')
    } else if (k) {
      setValidated('err')
    }
  }

  const submit = () => {
    const base: Asset = {
      id: 'a' + Date.now(),
      type,
      name: form.name ?? '',
      currency: form.currency ?? 'EUR',
      description: form.description || undefined,
    }

    if (type === 'crypto' || type === 'stock') {
      base.symbol = (form.symbol ?? '').toUpperCase()
      base.price = parseFloat(form.price ?? '') || 0
      base.quantity = parseFloat(form.quantity ?? '') || 0
      base.changePercent24h = 0
    } else if (type === 'fund') {
      base.symbol = (form.symbol ?? '').toUpperCase()
      base.price = parseFloat(form.price ?? '') || 0
      base.quantity = parseFloat(form.quantity ?? '') || 0
      base.changePercent24h = 0
      if (form.isin) base.isin = form.isin.toUpperCase()
      if (form.ter) base.ter = parseFloat(form.ter) || 0
      base.distribution = (form.distribution as 'Acc' | 'Dist') ?? 'Acc'
    } else if (type === 'savings') {
      base.bank = form.bank || form.name || 'Bank'
      base.name = form.name || form.bank || 'Savings'
      base.amount = parseFloat(form.amount ?? '') || 0
      if (form.apy) base.apy = parseFloat(form.apy) || 0
    } else if (type === 'realestate') {
      base.amount = parseFloat(form.amount ?? '') || 0
      base.subtype = form.subtype || 'direct'
      base.valuationDate = form.valuationDate || new Date().toISOString().slice(0, 10)
    } else if (type === 'collectible') {
      base.amount = parseFloat(form.amount ?? '') || 0
      base.subtype = form.subtype || 'gold'
    } else if (type === 'investment') {
      base.amount = parseFloat(form.amount ?? '') || 0
      base.subtype = form.subtype || 'other'
    }

    onAdd(base)
    toast({ title: `${base.name} added to ${CATEGORIES[type].label}`, variant: 'success' })
    onClose()
  }

  return (
    <div className="v-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="v-modal v-modal-lg" role="dialog" aria-modal="true" aria-labelledby="add-asset-title">
        <div className="v-modal-head">
          <div>
            <div className="v-modal-title" id="add-asset-title">Add New Asset</div>
            <div className="v-modal-sub">Add a position to your portfolio.</div>
          </div>
          <button className="v-btn v-btn-icon v-btn-ghost" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8"/>
            </svg>
          </button>
        </div>

        <div className="v-modal-body">
          {/* Type selector */}
          <div className="v-field">
            <label className="v-label">Type</label>
            <div className="v-typebar">
              {TYPE_TABS.map(opt => (
                <button key={opt.id} type="button" className={type === opt.id ? 'on' : ''} onClick={() => switchType(opt.id)}>
                  <span className="lbl">{opt.label}</span>
                  <span className="hint">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Real Estate */}
          {type === 'realestate' && <>
            <div className="v-field">
              <label className="v-label">Property name <span className="req">*</span></label>
              <div className="v-input-wrap">
                <input className="v-input" placeholder="Madrid · Salamanca flat" value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
              </div>
            </div>
            <div className="v-grid-2">
              <div className="v-field">
                <label className="v-label">Ownership type</label>
                <PillRow value={form.subtype ?? 'direct'} onChange={v => set('subtype', v)} options={SUBTYPES.realestate} />
              </div>
              <div className="v-field">
                <label className="v-label">Last valuation date</label>
                <div className="v-input-wrap">
                  <input className="v-input p-mono" type="date" value={form.valuationDate ?? ''} onChange={e => set('valuationDate', e.target.value)} />
                </div>
                <span className="v-hint">Manual valuation · update yearly</span>
              </div>
            </div>
            <div className="v-grid-2">
              <div className="v-field">
                <label className="v-label">Current valuation <span className="req">*</span></label>
                <MoneyInput value={form.amount ?? ''} onChange={v => set('amount', v)} currency={form.currency ?? 'EUR'} />
              </div>
              <div className="v-field">
                <label className="v-label">Currency</label>
                <CurrencyPicker value={form.currency ?? 'EUR'} onChange={v => set('currency', v)} />
              </div>
            </div>
          </>}

          {/* Collectibles */}
          {type === 'collectible' && <>
            <div className="v-field">
              <label className="v-label">Item name <span className="req">*</span></label>
              <div className="v-input-wrap">
                <input className="v-input" placeholder="Rolex Submariner · Gold 100g…" value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
              </div>
            </div>
            <div className="v-field">
              <label className="v-label">Subtype</label>
              <PillRow value={form.subtype ?? 'gold'} onChange={v => set('subtype', v)} options={SUBTYPES.collectible} />
            </div>
            <div className="v-grid-2">
              <div className="v-field">
                <label className="v-label">Estimated value <span className="req">*</span></label>
                <MoneyInput value={form.amount ?? ''} onChange={v => set('amount', v)} currency={form.currency ?? 'EUR'} />
                <span className="v-hint">Manual valuation</span>
              </div>
              <div className="v-field">
                <label className="v-label">Currency</label>
                <CurrencyPicker value={form.currency ?? 'EUR'} onChange={v => set('currency', v)} />
              </div>
            </div>
          </>}

          {/* Crypto / Stock */}
          {(type === 'crypto' || type === 'stock') && <>
            <div className="v-field">
              <label className="v-label">Symbol <span className="req">*</span></label>
              <div className="v-input-wrap">
                <input className="v-input p-mono"
                       placeholder={type === 'crypto' ? 'BTC, ETH, SOL…' : 'AAPL, NVDA, ASML…'}
                       value={form.symbol ?? ''}
                       onChange={e => { set('symbol', e.target.value); setValidated(null) }} />
                <div className="v-input-attach">
                  <button type="button" className="v-btn v-btn-sm" onClick={validate}>
                    {validated === 'ok' ? '✓ Validated' : 'Validate'}
                  </button>
                </div>
              </div>
              <span className={`v-hint${validated === 'ok' ? ' ok' : validated === 'err' ? ' err' : ''}`}>
                {validated === 'ok' ? 'Symbol found · data auto-filled'
                 : validated === 'err' ? 'Symbol not found. You can fill it in manually.'
                 : 'Click Validate to auto-fill name and price.'}
              </span>
            </div>
            <div className="v-field">
              <label className="v-label">Name <span className="req">*</span></label>
              <div className="v-input-wrap">
                <input className="v-input" placeholder={type === 'crypto' ? 'Bitcoin' : 'Apple Inc.'} value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
              </div>
            </div>
            <div className="v-grid-2">
              <div className="v-field">
                <label className="v-label">Price ({form.currency ?? 'EUR'})</label>
                <MoneyInput value={form.price ?? ''} onChange={v => set('price', v)} currency={form.currency ?? 'EUR'} />
              </div>
              <div className="v-field">
                <label className="v-label">Quantity</label>
                <div className="v-input-wrap">
                  <input className="v-input p-mono" placeholder="0.0000" inputMode="decimal"
                         value={form.quantity ?? ''} onChange={e => set('quantity', e.target.value)} />
                  <div className="v-input-suffix">{type === 'crypto' ? 'unit' : 'shares'}</div>
                </div>
              </div>
            </div>
            <div className="v-field">
              <label className="v-label">Price currency</label>
              <CurrencyPicker value={form.currency ?? 'EUR'} onChange={v => set('currency', v)} />
            </div>
          </>}

          {/* Fund */}
          {type === 'fund' && <>
            <div className="v-grid-2">
              <div className="v-field">
                <label className="v-label">Ticker <span className="req">*</span></label>
                <div className="v-input-wrap">
                  <input className="v-input p-mono" placeholder="VWCE…"
                         value={form.symbol ?? ''}
                         onChange={e => { set('symbol', e.target.value); setValidated(null) }} />
                  <div className="v-input-attach">
                    <button type="button" className="v-btn v-btn-sm" onClick={validate}>
                      {validated === 'ok' ? '✓ OK' : 'Validate'}
                    </button>
                  </div>
                </div>
                <span className={`v-hint${validated === 'ok' ? ' ok' : ''}`}>
                  {validated === 'ok' ? 'Fund found · data auto-filled' : 'e.g. VWCE, IWDA'}
                </span>
              </div>
              <div className="v-field">
                <label className="v-label">ISIN</label>
                <div className="v-input-wrap">
                  <input className="v-input p-mono" placeholder="IE00BK5BQT80" value={form.isin ?? ''} onChange={e => set('isin', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="v-field">
              <label className="v-label">Name <span className="req">*</span></label>
              <div className="v-input-wrap">
                <input className="v-input" placeholder="Vanguard FTSE All-World UCITS" value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
              </div>
            </div>
            <div className="v-grid-3">
              <div className="v-field">
                <label className="v-label">TER</label>
                <div className="v-input-wrap">
                  <input className="v-input p-mono" placeholder="0.22" inputMode="decimal"
                         value={form.ter ?? ''} onChange={e => set('ter', e.target.value)} />
                  <div className="v-input-suffix">%</div>
                </div>
                <span className="v-hint">annual expense ratio</span>
              </div>
              <div className="v-field">
                <label className="v-label">Distribution</label>
                <PillRow value={form.distribution ?? 'Acc'} onChange={v => set('distribution', v)}
                         options={[{ value: 'Acc', label: 'Accumulating' }, { value: 'Dist', label: 'Distributing' }]} />
              </div>
              <div className="v-field">
                <label className="v-label">Currency</label>
                <CurrencyPicker value={form.currency ?? 'EUR'} onChange={v => set('currency', v)} />
              </div>
            </div>
            <div className="v-grid-2">
              <div className="v-field">
                <label className="v-label">Price ({form.currency ?? 'EUR'})</label>
                <MoneyInput value={form.price ?? ''} onChange={v => set('price', v)} currency={form.currency ?? 'EUR'} />
              </div>
              <div className="v-field">
                <label className="v-label">Shares</label>
                <div className="v-input-wrap">
                  <input className="v-input p-mono" placeholder="0.0000" inputMode="decimal"
                         value={form.quantity ?? ''} onChange={e => set('quantity', e.target.value)} />
                  <div className="v-input-suffix">shares</div>
                </div>
              </div>
            </div>
          </>}

          {/* Savings */}
          {type === 'savings' && <>
            <div className="v-grid-2">
              <div className="v-field">
                <label className="v-label">Bank / Institution <span className="req">*</span></label>
                <div className="v-input-wrap">
                  <input className="v-input" placeholder="Trade Republic, Revolut…" value={form.bank ?? ''} onChange={e => set('bank', e.target.value)} />
                </div>
              </div>
              <div className="v-field">
                <label className="v-label">Account label</label>
                <div className="v-input-wrap">
                  <input className="v-input" placeholder="Emergency fund" value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="v-grid-3">
              <div className="v-field">
                <label className="v-label">Balance <span className="req">*</span></label>
                <MoneyInput value={form.amount ?? ''} onChange={v => set('amount', v)} currency={form.currency ?? 'EUR'} />
              </div>
              <div className="v-field">
                <label className="v-label">Currency</label>
                <CurrencyPicker value={form.currency ?? 'EUR'} onChange={v => set('currency', v)} />
              </div>
              <div className="v-field">
                <label className="v-label">APY</label>
                <div className="v-input-wrap">
                  <input className="v-input p-mono" placeholder="0.00" inputMode="decimal"
                         value={form.apy ?? ''} onChange={e => set('apy', e.target.value)} />
                  <div className="v-input-suffix">%</div>
                </div>
              </div>
            </div>
          </>}

          {/* Investment */}
          {type === 'investment' && <>
            <div className="v-field">
              <label className="v-label">Vehicle name <span className="req">*</span></label>
              <div className="v-input-wrap">
                <input className="v-input" placeholder="Indexa · Mintos · Seedrs…" value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
              </div>
            </div>
            <div className="v-field">
              <label className="v-label">Subtype</label>
              <PillRow value={form.subtype ?? 'startup'} onChange={v => set('subtype', v)} options={SUBTYPES.investment} />
            </div>
            <div className="v-grid-2">
              <div className="v-field">
                <label className="v-label">Invested amount <span className="req">*</span></label>
                <MoneyInput value={form.amount ?? ''} onChange={v => set('amount', v)} currency={form.currency ?? 'EUR'} />
              </div>
              <div className="v-field">
                <label className="v-label">Currency</label>
                <CurrencyPicker value={form.currency ?? 'EUR'} onChange={v => set('currency', v)} />
              </div>
            </div>
          </>}

          {/* Shared: description */}
          <div className="v-field">
            <label className="v-label">Short Description</label>
            <div className="v-input-wrap">
              <input className="v-input" placeholder="E.g. My main investment" maxLength={30}
                     value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
              <div className="v-input-suffix">{(form.description ?? '').length}/30</div>
            </div>
            <span className="v-hint">Max 30 characters. Shown in the asset list.</span>
          </div>
        </div>

        <div className="v-modal-foot">
          <button className="v-btn" onClick={onClose}>Cancel</button>
          <button className="v-btn v-btn-primary" onClick={submit}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 3v10M3 8h10"/>
            </svg>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
