import { useMemo, useState } from 'react'
import { Card } from '@venator-ui/ui'
import { CATEGORIES, CATEGORY_ORDER, assetValueEUR, eurCompact, pctRaw } from '../../lib/utils'
import type { Asset, AssetCategory } from '../../types/portfolio'

interface AllocationWidgetProps {
  assets: Asset[]
  hideValues: boolean
}

export function AllocationWidget({ assets, hideValues }: AllocationWidgetProps) {
  const [hover, setHover] = useState<AssetCategory | null>(null)

  const totals = useMemo(() => {
    const m: Record<string, number> = {}
    CATEGORY_ORDER.forEach((id) => { m[id] = 0 })
    assets.forEach((a) => { m[a.type] = (m[a.type] ?? 0) + assetValueEUR(a) })
    return m
  }, [assets])

  const grandTotal = Math.max(Object.values(totals).reduce((s, n) => s + n, 0), 1)

  const size = 168, stroke = 22, r = (size - stroke) / 2, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  let acc = 0

  return (
    <Card padding="none" className="w-allocation">
      <div className="v-card-head">
        <div>
          <div className="v-card-title">Allocation</div>
          <div className="v-card-sub">By category · current weights</div>
        </div>
      </div>
      <div className="v-card-body w-allocation-body">
        <div className="w-donut-wrap">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={stroke} opacity="0.35" />
            {CATEGORY_ORDER.map((id) => {
              const v = totals[id]
              if (v <= 0) return null
              const frac = v / grandTotal
              const dash = frac * circ
              const seg = (
                <circle
                  key={id}
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={CATEGORIES[id].color}
                  strokeWidth={hover === id ? stroke + 3 : stroke}
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={-acc}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: 'stroke-width 140ms', cursor: 'pointer' }}
                  onMouseEnter={() => setHover(id)}
                  onMouseLeave={() => setHover(null)}
                />
              )
              acc += dash
              return seg
            })}
          </svg>
          <div className="w-donut-center">
            <div className="lbl">{hover ? CATEGORIES[hover].short : 'Total'}</div>
            <div className="val">
              {hideValues ? '••••••' : eurCompact(hover ? totals[hover] : grandTotal)}
            </div>
            <div className="sub">
              {hover ? pctRaw((totals[hover] / grandTotal) * 100) : `${assets.length} assets`}
            </div>
          </div>
        </div>

        <ul className="w-legend">
          {CATEGORY_ORDER.map((id) => {
            const v = totals[id]
            const p = (v / grandTotal) * 100
            return (
              <li
                key={id}
                className={hover === id ? 'on' : ''}
                onMouseEnter={() => setHover(id)}
                onMouseLeave={() => setHover(null)}
              >
                <span className="dot" style={{ background: CATEGORIES[id].color }} />
                <span className="nm">{CATEGORIES[id].short}</span>
                <span className="pc">{pctRaw(p)}</span>
                <span className="vl">{hideValues ? '•••' : eurCompact(v)}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}
