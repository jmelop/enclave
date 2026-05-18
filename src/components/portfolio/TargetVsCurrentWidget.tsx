import { useMemo } from 'react'
import { Card } from '@venator-ui/ui'
import { CATEGORIES, CATEGORY_ORDER, TARGETS, assetValueEUR, pctRaw, num } from '../../lib/utils'
import type { Asset } from '../../types/portfolio'

interface TargetVsCurrentWidgetProps {
  assets: Asset[]
}

export function TargetVsCurrentWidget({ assets }: TargetVsCurrentWidgetProps) {
  const totals = useMemo(() => {
    const m: Record<string, number> = {}
    CATEGORY_ORDER.forEach((id) => { m[id] = 0 })
    assets.forEach((a) => { m[a.type] = (m[a.type] ?? 0) + assetValueEUR(a) })
    return m
  }, [assets])

  const grand = Math.max(Object.values(totals).reduce((s, n) => s + n, 0), 1)

  return (
    <Card padding="none" className="w-target">
      <div className="v-card-head">
        <div>
          <div className="v-card-title">Target vs Current</div>
          <div className="v-card-sub">DCA guidance · drift from target weights</div>
        </div>
        <div className="v-card-tools">
          <span className="w-chip">edit targets</span>
        </div>
      </div>
      <div className="w-target-body">
        {CATEGORY_ORDER.map((id) => {
          const cur = (totals[id] / grand) * 100
          const tgt = TARGETS[id] ?? 0
          const delta = cur - tgt
          const maxW = Math.max(cur, tgt, 30)
          const tone = Math.abs(delta) < 1 ? 'flat' : delta > 0 ? 'over' : 'under'

          return (
            <div className="w-tgt-row" key={id}>
              <div className="w-tgt-name">
                <span className="dot" style={{ background: CATEGORIES[id].color }} />
                {CATEGORIES[id].short}
              </div>
              <div className="w-tgt-track">
                <div className="w-tgt-target" style={{ width: `${(tgt / maxW) * 100}%` }} />
                <div className="w-tgt-current" style={{ width: `${(cur / maxW) * 100}%`, background: CATEGORIES[id].color }} />
                <div className="w-tgt-marker" style={{ left: `${(tgt / maxW) * 100}%` }} />
              </div>
              <div className="w-tgt-numbers">
                <span className="cur">{pctRaw(cur)}</span>
                <span className="sep">/</span>
                <span className="tgt">{pctRaw(tgt)}</span>
                <span className={`delta ${tone}`}>
                  {delta >= 0 ? '+' : ''}{num(delta, 1)}pp
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
