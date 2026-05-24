import { useMemo } from 'react'
import { Card } from '@venator-ui/ui'
import { Icon } from '../Icon'
import { assetValueEUR, eurCompact, pctRaw, num, FX, FX_COLORS } from '../../lib/utils'
import type { Asset } from '../../types/portfolio'

interface FXExposureWidgetProps {
  assets: Asset[]
  hideValues: boolean
}

export function FXExposureWidget({ assets, hideValues }: FXExposureWidgetProps) {
  const buckets = useMemo(() => {
    const m: Record<string, number> = {}
    assets.forEach((a) => {
      const c = a.currency || 'EUR'
      m[c] = (m[c] ?? 0) + assetValueEUR(a)
    })
    return m
  }, [assets])

  const total = Math.max(Object.values(buckets).reduce((s, n) => s + n, 0), 1)
  const ordered = Object.entries(buckets).sort((a, b) => b[1] - a[1])

  const fxColor = (c: string) => FX_COLORS[c] ?? 'var(--fg-3)'

  return (
    <Card padding="none" className="w-fx">
      <div className="v-card-head">
        <div>
          <div className="v-card-title">FX Exposure</div>
          <div className="v-card-sub">By underlying currency · EUR-equivalent</div>
        </div>
        <div className="v-card-tools">
          <span className="w-chip">
            <Icon name="globe" size={12} />&nbsp; mock rates
          </span>
        </div>
      </div>
      <div className="v-card-body w-fx-body">
        <div className="w-fx-bar" role="img" aria-label="Currency exposure stacked bar">
          {ordered.map(([c, v]) => (
            <div
              key={c}
              className="w-fx-seg"
              style={{ width: `${(v / total) * 100}%`, background: fxColor(c) }}
              title={`${c} ${pctRaw((v / total) * 100)}`}
            />
          ))}
        </div>
        <ul className="w-fx-list">
          {ordered.map(([c, v]) => (
            <li key={c}>
              <span className="dot" style={{ background: fxColor(c) }} />
              <span className="cur">{c}</span>
              <span className="pc">{pctRaw((v / total) * 100)}</span>
              <span className="vl">{hideValues ? '•••' : eurCompact(v)}</span>
            </li>
          ))}
        </ul>
        <div className="w-fx-rates">
          <span>1 USD = {num(FX.USD, 4)} €</span>
          <span>1 GBP = {num(FX.GBP, 4)} €</span>
          <span>1 CHF = {num(FX.CHF, 4)} €</span>
        </div>
      </div>
    </Card>
  )
}
