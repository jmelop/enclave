// TODO: historial fuera de alcance — ver rama futura feat/inventory-history
// import type { HistoryEntry } from '@/types/inventory'

interface HistoryEntry { d: string; q: number; why: string }

interface HistoryChartProps {
  history: HistoryEntry[] | null
  accent: string
}

export function HistoryChart({ history, accent }: HistoryChartProps) {
  if (!history || history.length === 0) {
    return <div className="hist-empty">No quantity changes recorded.</div>
  }

  const max = Math.max(...history.map((h) => h.q), 1)

  return (
    <div className="hist-chart">
      <div className="hist-bars">
        {history.map((h, i) => {
          const pct = (h.q / max) * 100
          return (
            <div key={i} className="hist-bar-col">
              <div className="hist-bar-track">
                <div className="hist-bar-fill" style={{ height: `${pct}%`, background: accent }} />
                <span className="hist-bar-val">{h.q}</span>
              </div>
              <div className="hist-bar-meta">
                <div className="hist-date">{h.d}</div>
                <div className="hist-why">{h.why}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
