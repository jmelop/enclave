import { useEffect, useMemo, useState } from 'react'
import { Button, Card, useToast } from '@venator-ui/ui'
import { Icon } from '../components/Icon'
import { PortfolioValueChart } from '../components/portfolio/PortfolioValueChart'
import { usePortfolioStore } from '../store/portfolioStore'
import { eur, pct } from '../lib/utils'

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  )
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('enclave-theme', next)
    setTheme(next)
  }
  return { theme, toggle }
}

function signedEur(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${eur(Math.abs(value))}`
}

function Stat({
  label,
  value,
  foot,
  icon,
  tone = '',
  hideValues,
}: {
  label: string
  value: string
  foot: string
  icon: string
  tone?: 'up' | 'down' | ''
  hideValues: boolean
}) {
  return (
    <div className="p-stat">
      <div className="p-stat-label">
        <span>{label}</span>
        <span className="icon"><Icon name={icon} /></span>
      </div>
      <div className="p-stat-value">{hideValues ? '******' : value}</div>
      <div className={`p-stat-foot${tone ? ' ' + tone : ''}`}>{foot}</div>
    </div>
  )
}

export function PortfolioHistory() {
  const {
    snapshots,
    historyLoading,
    historyError,
    fetchHistory,
    captureSnapshot,
    hydrate,
  } = usePortfolioStore()
  const [hideValues, setHideValues] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const { theme, toggle: toggleTheme } = useTheme()
  const { toast } = useToast()

  useEffect(() => {
    void hydrate()
    void fetchHistory()
  }, [hydrate, fetchHistory])

  useEffect(() => {
    if (snapshots.length === 0) return
    if (!activeKey || !snapshots.some((snapshot) => snapshot.monthKey === activeKey)) {
      setActiveKey(snapshots[snapshots.length - 1].monthKey)
    }
  }, [activeKey, snapshots])

  const rows = useMemo(() => snapshots.map((snapshot, index) => {
    const previous = snapshots[index - 1]
    const delta = previous ? snapshot.totalValue - previous.totalValue : 0
    const deltaPct = previous?.totalValue ? (delta / previous.totalValue) * 100 : 0
    return { ...snapshot, delta, deltaPct }
  }), [snapshots])

  const latest = rows[rows.length - 1]
  const first = rows[0]
  const totalGrowth = latest && first ? latest.totalValue - first.totalValue : 0
  const totalGrowthPct = first?.totalValue ? (totalGrowth / first.totalValue) * 100 : 0
  const bestMonth = rows.slice(1).sort((a, b) => b.delta - a.delta)[0] ?? latest
  const selectedKey = activeKey ?? latest?.monthKey ?? ''
  const now = new Date().toISOString().slice(0, 10)

  const handleCapture = async () => {
    try {
      await captureSnapshot()
      toast({ title: 'Snapshot saved', variant: 'success' })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Error saving snapshot',
        variant: 'error',
      })
    }
  }

  return (
    <main className="v-main">
      <div className="v-topbar">
        <span className="crumb">enclave</span>
        <span className="sep">/</span>
        <span className="crumb">portfolio</span>
        <span className="sep">/</span>
        <span className="crumb active">history</span>
        <span className="v-cursor">|</span>
        <span className="spacer" />
        <span className="pill"><span className="dot" />synced</span>
        <span style={{ color: 'var(--fg-5)' }}>.</span>
        <span>{now}</span>
        <span style={{ color: 'var(--fg-5)' }}>.</span>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            appearance: 'none', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--fg-3)', display: 'flex',
            alignItems: 'center', padding: 0,
          }}
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="3.5"/>
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M11.8 3.2l-1 1M4.2 11.8l-1 1"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z"/>
            </svg>
          )}
        </button>
      </div>

      <div className="p-header">
        <div>
          <div className="p-tag mono">// MODULE - enclave-portfolio</div>
          <h1 className="p-title">History<span className="p-title-dot">.</span></h1>
          <p className="p-subtitle">
            Monthly portfolio value, tracked as a clean snapshot series.
          </p>
          <div className="p-meta">
            <span><b>{snapshots.length}</b> months</span>
            {latest && <span><b>{latest.snapshotDate}</b> latest snapshot</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            variant="secondary"
            size="sm"
            title={hideValues ? 'Show values' : 'Hide values'}
            onClick={() => setHideValues((v) => !v)}
          >
            <Icon name="eye" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void fetchHistory()} disabled={historyLoading}>
            <span className="p-action-icon"><Icon name="refresh" /></span>
            <span>Refresh</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleCapture} disabled={historyLoading}>
            <span className="p-action-icon"><Icon name="chart" /></span>
            <span>Capture snapshot</span>
          </Button>
        </div>
      </div>

      {historyLoading && snapshots.length === 0 ? (
        <div className="p-history-state">Loading history...</div>
      ) : historyError && snapshots.length === 0 ? (
        <div className="p-history-state">
          <span>{historyError}</span>
          <button className="v-btn v-btn-sm v-btn-secondary" onClick={() => void fetchHistory()}>
            Retry
          </button>
        </div>
      ) : snapshots.length === 0 ? (
        <div className="p-history-state">No history yet.</div>
      ) : (
        <>
          <div className="p-stats">
            <Stat
              label="Latest snapshot"
              value={eur(latest.totalValue)}
              foot={`${latest.label} ${latest.year}`}
              icon="wallet"
              hideValues={hideValues}
            />
            <Stat
              label="Total growth"
              value={signedEur(totalGrowth)}
              foot={`${pct(totalGrowthPct)} across ${snapshots.length} months`}
              icon={totalGrowth >= 0 ? 'trendUp' : 'trendDown'}
              tone={totalGrowth >= 0 ? 'up' : 'down'}
              hideValues={hideValues}
            />
            <Stat
              label="Best month"
              value={bestMonth ? signedEur(bestMonth.delta) : eur(0)}
              foot={bestMonth ? `${bestMonth.label} ${bestMonth.year}` : 'No movement yet'}
              icon="chart"
              tone={bestMonth && bestMonth.delta >= 0 ? 'up' : 'down'}
              hideValues={hideValues}
            />
          </div>

          <Card padding="none" className="p-history-card">
            <div className="v-card-head">
              <div>
                <div className="v-card-title">Portfolio value</div>
                <div className="v-card-sub">Monthly snapshots</div>
              </div>
              <div className="p-history-legend">
                <span><span className="line" />Value EUR</span>
              </div>
            </div>
            <div className="v-card-body">
              <PortfolioValueChart
                snapshots={snapshots}
                activeKey={selectedKey}
                hideValues={hideValues}
                onSelect={setActiveKey}
              />
            </div>
          </Card>

          <Card padding="none" className="p-history-card">
            <div className="v-card-head">
              <div>
                <div className="v-card-title">Month by month</div>
                <div className="v-card-sub">Monthly portfolio totals</div>
              </div>
            </div>
            <div className="p-history-table-wrap">
              <div className="p-history-table">
                <div className="p-history-head">
                  <span>Month</span>
                  <span>Snapshot</span>
                  <span className="right">Value</span>
                  <span className="right">Change</span>
                  <span className="right">Assets</span>
                </div>
                {rows.slice().reverse().map((row) => {
                  const active = row.monthKey === selectedKey
                  const tone = row.delta > 0 ? 'up' : row.delta < 0 ? 'down' : 'flat'

                  return (
                    <button
                      key={row.monthKey}
                      type="button"
                      className={`p-history-row${active ? ' active' : ''}`}
                      onClick={() => setActiveKey(row.monthKey)}
                    >
                      <span className="month">
                        {active && <span className="active-dot" />}
                        {row.label} {row.year}
                      </span>
                      <span className="mono muted">{row.snapshotDate}</span>
                      <span className="mono right">{hideValues ? '******' : eur(row.totalValue)}</span>
                      <span className={`mono right ${tone}`}>
                        {hideValues ? '******' : signedEur(row.delta)}
                        <span className="delta-pct">{row.delta === 0 ? '0.00%' : pct(row.deltaPct)}</span>
                      </span>
                      <span className="mono right muted">{row.assetCount}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>
        </>
      )}
    </main>
  )
}
