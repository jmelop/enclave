import { Card, Button } from '@venator-ui/ui'
import { Icon } from '../Icon'
import { CATEGORIES, assetValue, assetValueEUR, eur, eurCompact, num, pct } from '../../lib/utils'
import type { Asset, AssetCategory } from '../../types/portfolio'

interface AssetRowProps {
  asset: Asset
  hideValues: boolean
}

function AssetRow({ asset, hideValues }: AssetRowProps) {
  const cat = CATEGORIES[asset.type]
  const isMarket = asset.price != null && asset.quantity != null
  const value = assetValue(asset)
  const valueEUR = assetValueEUR(asset)
  const isUp = isMarket && (asset.changePercent24h ?? 0) >= 0

  const primary = isMarket ? asset.symbol! : asset.name
  const secondary = isMarket ? asset.name : (asset.bank ?? '')

  let detail = ''
  if (isMarket) {
    const qty = num(asset.quantity!, asset.type === 'crypto' ? 4 : asset.type === 'fund' ? 2 : 0)
    detail = `${qty} × ${eur(asset.price!)}`
    if (asset.currency !== 'EUR') detail += ` ${asset.currency}`
  } else if (asset.type === 'savings') {
    detail = asset.apy != null ? `${num(asset.apy, 2)}% APY` : 'remunerated'
  } else if (asset.type === 'realestate') {
    detail = `valued ${asset.valuationDate ?? 'manually'}`
  } else if (asset.type === 'collectible') {
    detail = `${asset.subtype ?? 'physical'} · manual val.`
  } else if (asset.type === 'investment') {
    detail = asset.subtype ?? 'alternative'
  }

  const chips: { k: string; v: string }[] = []
  if (asset.type === 'fund') {
    if (asset.isin)         chips.push({ k: 'isin', v: asset.isin })
    if (asset.ter != null)  chips.push({ k: 'ter',  v: `${num(asset.ter, 2)}%` })
    if (asset.distribution) chips.push({ k: 'dist', v: asset.distribution })
  }
  if (asset.currency !== 'EUR') chips.push({ k: 'fx', v: asset.currency })

  return (
    <div className={`p-asset ${asset.type}`}>
      <div
        className="p-asset-mono"
        style={{ background: `${cat.color}22`, color: cat.color, borderColor: `${cat.color}55` }}
      >
        {primary[0]?.toUpperCase()}
      </div>

      <div className="p-asset-name">
        <div className="sym">
          <span>{primary}</span>
          <span className="v-badge">{cat.short.toLowerCase()}</span>
        </div>
        {chips.length > 0 && (
          <div className="chips">
            {chips.map((c) => (
              <span key={c.k} className="p-chip">
                {c.k} <b>{c.v}</b>
              </span>
            ))}
          </div>
        )}
        <div className="nm">
          {secondary}
          {asset.description && (
            <><span className="dimsep"> · </span>{asset.description}</>
          )}
        </div>
      </div>

      <div className="p-asset-desc">{detail}</div>

      <div className="p-asset-val">
        <div className="v">{hideValues ? '••••••' : eur(valueEUR)}</div>
        <div className="q">
          {asset.currency !== 'EUR' && !hideValues
            ? `${asset.currency} ${num(value, 2)}`
            : isMarket
              ? `${num(asset.quantity!, asset.type === 'crypto' ? 4 : 2)} units`
              : ''}
        </div>
      </div>

      <div className={`p-asset-chg ${isMarket ? (isUp ? 'up' : 'down') : 'flat'}`}>
        {isMarket && <Icon name={isUp ? 'trendUp' : 'trendDown'} size={12} />}
        {isMarket ? pct(asset.changePercent24h!) : '—'}
      </div>

      <div className="p-asset-actions">
        <Button variant="ghost" size="sm" title="More options" style={{ width: 28, padding: 0 }}>
          <Icon name="dots" />
        </Button>
      </div>
    </div>
  )
}

interface ManualAutoToggleProps {
  mode: 'manual' | 'auto'
  onChange: (m: 'manual' | 'auto') => void
  locked: boolean
}

function ManualAutoToggle({ mode, onChange, locked }: ManualAutoToggleProps) {
  return (
    <div className={`v-toggle${locked ? ' locked' : ''}`} role="group">
      {locked ? (
        <span className="v-toggle-locked">
          <Icon name="lock" size={11} /> manual only
        </span>
      ) : (
        <>
          <button className={mode === 'manual' ? 'on' : ''} onClick={() => onChange('manual')}>
            Manual
          </button>
          <button className={mode === 'auto' ? 'on' : ''} onClick={() => onChange('auto')}>
            Auto
          </button>
        </>
      )}
    </div>
  )
}

interface AssetTableProps {
  assets: Asset[]
  category: AssetCategory
  hideValues: boolean
  mode: 'manual' | 'auto'
  onModeChange: (m: 'manual' | 'auto') => void
}

export function AssetTable({ assets, category, hideValues, mode, onModeChange }: AssetTableProps) {
  const cat = CATEGORIES[category]
  const filtered = assets.filter((a) => a.type === category)
  const total = filtered.reduce((s, a) => s + assetValueEUR(a), 0)
  const isAuto = cat.pricing === 'auto'

  return (
    <Card padding="none">
      <div className="v-card-head">
        <div>
          <div className="v-card-title">{cat.label}</div>
          <div className="v-card-sub">
            {filtered.length} {filtered.length === 1 ? 'position' : 'positions'} ·{' '}
            {hideValues ? '••••••' : eurCompact(total)} total
          </div>
        </div>
        <div className="v-card-tools">
          <ManualAutoToggle mode={mode} onChange={onModeChange} locked={!isAuto} />
          {isAuto && (
            <Button variant="secondary" size="sm" title="Refresh prices" style={{ width: 28, padding: 0 }}>
              <Icon name="refresh" size={14} />
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-empty">
          <h4>No assets in this category</h4>
          <p>Add your first {cat.label.toLowerCase()} from the Add Asset button.</p>
        </div>
      ) : (
        <div>
          {filtered.map((a) => (
            <AssetRow key={a.id} asset={a} hideValues={hideValues} />
          ))}
        </div>
      )}
    </Card>
  )
}
