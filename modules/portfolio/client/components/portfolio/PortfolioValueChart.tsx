import { eurCompact } from '../../lib/utils'
import type { PortfolioSnapshot } from '../../types/portfolio'

interface PortfolioValueChartProps {
  snapshots: PortfolioSnapshot[]
  activeKey: string
  hideValues: boolean
  onSelect: (key: string) => void
}

export function PortfolioValueChart({ snapshots, activeKey, hideValues, onSelect }: PortfolioValueChartProps) {
  const data = snapshots.map((snapshot) => ({
    ...snapshot,
    value: snapshot.totalValue,
  }))

  const W = 760
  const H = 250
  const padL = 20
  const padR = 20
  const padT = 24
  const padB = 34
  const iw = W - padL - padR
  const ih = H - padT - padB

  const values = data.map((d) => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const span = maxValue - minValue || Math.max(maxValue, 1) * 0.08
  const minDomain = Math.max(0, minValue - span * 0.45)
  const maxDomain = maxValue + span * 0.25
  const domain = maxDomain - minDomain || 1
  const slot = iw / data.length
  const bw = Math.min(42, slot * 0.45)

  const xv = (i: number) => padL + slot * i + slot / 2

  const yv = (value: number) => padT + ih - ((value - minDomain) / domain) * ih
  const point = (d: typeof data[number], i: number) => `${xv(i)},${yv(d.value)}`
  const linePoints = data.map(point).join(' ')
  const baselineY = yv(minDomain)
  const areaPoints = `${padL},${baselineY} ${linePoints} ${padL + iw},${baselineY}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="p-history-chart"
      role="img"
      aria-label="Portfolio value history"
    >
      <defs>
        <linearGradient id="portfolio-history-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--info)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--info)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = padT + ih * tick
        return (
          <line
            key={tick}
            x1={padL}
            y1={y}
            x2={W - padR}
            y2={y}
            stroke="var(--border-subtle)"
            strokeWidth="1"
            strokeDasharray={tick === 1 ? undefined : '3 6'}
          />
        )
      })}

      <polygon points={areaPoints} fill="url(#portfolio-history-fill)" />

      {data.map((d, i) => {
        const active = d.monthKey === activeKey
        const x = xv(i)
        const y = yv(d.value)
        const barH = Math.max(4, baselineY - y)
        const barY = baselineY - barH
        const labelInside = barH > 32

        return (
          <g key={`${d.monthKey}-bar`} onClick={() => onSelect(d.monthKey)} style={{ cursor: 'pointer' }}>
            <rect x={x - slot / 2} y={padT} width={slot} height={ih} fill="transparent" />
            <rect
              x={x - bw / 2}
              y={barY}
              width={bw}
              height={barH}
              rx="5"
              fill={active ? 'var(--accent)' : 'var(--bg-3)'}
              stroke={active ? 'none' : 'var(--border-subtle)'}
              style={{ transition: 'all 160ms ease' }}
            />
            {active && !hideValues && (
              <text
                x={x}
                y={labelInside ? barY + 17 : barY - 8}
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
                fill={labelInside ? 'var(--accent-ink)' : 'var(--fg)'}
              >
                {eurCompact(d.value)}
              </text>
            )}
          </g>
        )
      })}

      <polyline
        points={linePoints}
        fill="none"
        stroke="var(--success)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((d, i) => {
        const active = d.monthKey === activeKey
        const x = xv(i)
        const y = yv(d.value)

        return (
          <g key={d.monthKey} onClick={() => onSelect(d.monthKey)} style={{ cursor: 'pointer' }}>
            <rect x={x - slot / 2} y={padT} width={slot} height={ih} fill="transparent" />
            {active && (
              <>
                <line x1={x} y1={padT} x2={x} y2={padT + ih} stroke="var(--border-default)" strokeDasharray="3 5" />
              </>
            )}
            <circle
              cx={x}
              cy={y}
              r={active ? 5 : 3.5}
              fill={active ? 'var(--fg)' : 'var(--bg-1)'}
              stroke={active ? 'var(--fg)' : 'var(--info)'}
              strokeWidth="2"
              style={{ transition: 'all 120ms ease' }}
            />
            <text
              x={x}
              y={H - 10}
              textAnchor="middle"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fill={active ? 'var(--fg)' : 'var(--fg-4)'}
              fontWeight={active ? '600' : '400'}
            >
              {d.label.slice(0, 3).toUpperCase()}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
