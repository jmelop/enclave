import { useMemo } from 'react'
import { Icon } from '../Icon'
import { usePortfolioStore } from '../../store/portfolioStore'
import { assetValueEUR, eur, eurCompact, pct, CATEGORIES } from '../../lib/utils'
import type { Asset } from '../../types/portfolio'

// Seeded deterministic sparkline
function Spark({ up = true, w = 70, h = 22, seed = 0 }: { up?: boolean; w?: number; h?: number; seed?: number }) {
  const rng = (s: number) => { const x = Math.sin(s) * 10000; return x - Math.floor(x) }
  const pts = Array.from({ length: 14 }, (_, i) => {
    const base = up ? i * 0.6 : 14 - i * 0.6
    return base + (rng(seed + i) - 0.5) * 4
  })
  const min = Math.min(...pts), max = Math.max(...pts)
  const norm = pts.map((p) => (p - min) / (max - min || 1))
  const d = norm.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (norm.length - 1)) * w} ${h - p * h}`).join(' ')
  return (
    <svg width={w} height={h} className="spark" viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={d} stroke={up ? 'var(--success)' : 'var(--danger)'} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface StatProps {
  label: string
  value: React.ReactNode
  foot: React.ReactNode
  footTone?: 'up' | 'down' | ''
  icon: string
  spark: React.ReactNode
  hideValues: boolean
}

function Stat({ label, value, foot, footTone = '', icon, spark, hideValues }: StatProps) {
  return (
    <div className="p-stat">
      <div className="p-stat-label">
        <span>{label}</span>
        <span className="icon"><Icon name={icon} /></span>
      </div>
      <div className="p-stat-value">
        {hideValues ? <span>••••••</span> : value}
      </div>
      <div className={`p-stat-foot${footTone ? ' ' + footTone : ''}`}>{foot}</div>
      {spark}
    </div>
  )
}

interface SummaryCardsProps {
  assets: Asset[]
  hideValues: boolean
}

export function SummaryCards({ assets, hideValues }: SummaryCardsProps) {
  const { fxRates } = usePortfolioStore()
  void fxRates

  const total = useMemo(() => assets.reduce((s, a) => s + assetValueEUR(a), 0), [assets])

  const dayChange = useMemo(() => assets.reduce((s, a) => {
    if (a.changePercent24h != null) {
      const v = assetValueEUR(a)
      const prev = v / (1 + a.changePercent24h / 100)
      return s + (v - prev)
    }
    return s
  }, 0), [assets])

  const dayPct = total ? (dayChange / total) * 100 : 0
  const dayUp = dayChange >= 0

  const best = useMemo(() => {
    const m = assets.filter((a) => a.changePercent24h != null)
    if (!m.length) return null
    return m.reduce((b, a) => (a.changePercent24h! > (b?.changePercent24h ?? -Infinity) ? a : b), null as Asset | null)
  }, [assets])

  const categories = [...new Set(assets.map((a) => a.type))]
    .map((t) => CATEGORIES[t]?.short)
    .filter(Boolean)
    .slice(0, 4)
    .join(' · ')

  return (
    <div className="p-stats">
      <Stat
        label="Total Value"
        value={eur(total)}
        foot={
          <>
            <Icon name={dayUp ? 'trendUp' : 'trendDown'} size={12} />
            &nbsp;{pct(dayPct)}{' '}
            <span className="mono">({hideValues ? '••••' : eurCompact(Math.abs(dayChange))})</span> today
          </>
        }
        footTone={dayUp ? 'up' : 'down'}
        icon="wallet"
        spark={<Spark up={dayUp} seed={1} />}
        hideValues={hideValues}
      />
      <Stat
        label="Total Assets"
        value={<>{assets.length}<span className="unit">positions</span></>}
        foot={<span className="mono">{categories}</span>}
        icon="pie"
        spark={<Spark up seed={2} />}
        hideValues={hideValues}
      />
      <Stat
        label="Best 24h Performer"
        value={best ? pct(best.changePercent24h!) : '—'}
        foot={
          best
            ? <span className="mono">{best.symbol || best.name} · {best.symbol ? best.name : ''}</span>
            : 'No market positions'
        }
        footTone={best && best.changePercent24h! >= 0 ? 'up' : 'down'}
        icon="chart"
        spark={<Spark up={!!best && best.changePercent24h! >= 0} seed={3} />}
        hideValues={hideValues}
      />
    </div>
  )
}
