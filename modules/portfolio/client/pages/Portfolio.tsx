import { useState, useEffect, useMemo } from 'react'
import { Button } from '@venator-ui/ui'
import { Icon } from '../components/Icon'
import { SummaryCards } from '../components/portfolio/SummaryCards'
import { AllocationWidget } from '../components/portfolio/AllocationWidget'
import { TargetVsCurrentWidget } from '../components/portfolio/TargetVsCurrentWidget'
import { FXExposureWidget } from '../components/portfolio/FXExposureWidget'
import { AssetTable } from '../components/portfolio/AssetTable'
import AddAssetModal from '../components/portfolio/AddAssetModal'
import { usePortfolioStore } from '../store/portfolioStore'
import { CATEGORIES, CATEGORY_ORDER } from '../lib/utils'
import type { AssetCategory } from '../types/portfolio'

const TABS = CATEGORY_ORDER.map((id, i) => ({
  id: id as AssetCategory,
  label: CATEGORIES[id].label,
  kbd: String(i + 1),
}))

type Modes = Record<AssetCategory, 'manual' | 'auto'>

const DEFAULT_MODES: Modes = {
  stock: 'auto', fund: 'auto', crypto: 'auto',
  realestate: 'manual', collectible: 'manual', savings: 'manual', investment: 'manual',
}

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  )
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    setTheme(next)
  }
  return { theme, toggle }
}

export function Portfolio() {
  const { assets, addAsset, loading, error, hydrated, hydrate } = usePortfolioStore()
  const [activeTab, setActiveTab] = useState<AssetCategory>('stock')
  const [hideValues, setHideValues] = useState(false)
  const [modes, setModes] = useState<Modes>(DEFAULT_MODES)
  const [showAddModal, setShowAddModal] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    hydrate()
  }, [])

  // Keyboard shortcuts: 1–7 for tabs, N for add
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const tab = TABS.find((t) => t.kbd === e.key)
      if (tab) setActiveTab(tab.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    assets.forEach((a) => { c[a.type] = (c[a.type] ?? 0) + 1 })
    return c
  }, [assets])

  const totalAssets = assets.length
  const totalCategories = new Set(assets.map((a) => a.type)).size

  const now = new Date().toISOString().slice(0, 10)

  return (
    <main className="v-main">
      {/* Topbar */}
      <div className="v-topbar">
        <span className="crumb">enclave</span>
        <span className="sep">/</span>
        <span className="crumb active">portfolio</span>
        <span className="v-cursor">▊</span>
        <span className="spacer" />
        <span className="pill"><span className="dot" />synced</span>
        <span style={{ color: 'var(--fg-5)' }}>·</span>
        <span>{now}</span>
        <span style={{ color: 'var(--fg-5)' }}>·</span>
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

      {/* Header */}
      <div className="p-header">
        <div>
          <div className="p-tag mono">// MODULE · enclave-portfolio</div>
          <h1 className="p-title">Portfolio<span className="p-title-dot">.</span></h1>
          <p className="p-subtitle">
            Track your investments in real time — real estate, collectibles, markets, savings and alternatives.
          </p>
          <div className="p-meta">
            <span><b>{totalAssets}</b> assets</span>
            <span><b>{totalCategories}</b> categories</span>
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
          <Button variant="secondary" size="sm">
            <Icon name="refresh" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" /> Add Asset
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <SummaryCards assets={assets} hideValues={hideValues} />

      {/* Insights row */}
      <div className="p-insights">
        <AllocationWidget assets={assets} hideValues={hideValues} />
        <TargetVsCurrentWidget assets={assets} />
        <FXExposureWidget assets={assets} hideValues={hideValues} />
      </div>

      {/* Asset list area — exclusive states */}
      {(loading && !hydrated) ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--fg-3)', fontSize: 13 }}>
          Loading…
        </div>
      ) : (error && !hydrated) ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '64px 0' }}>
          <p style={{ margin: 0, color: 'var(--fg-3)', fontSize: 13 }}>{error}</p>
          <button className="v-btn v-btn-sm v-btn-secondary" onClick={() => hydrate()}>
            Retry
          </button>
        </div>
      ) : (hydrated && assets.length === 0) ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--fg-3)', fontSize: 13 }}>
          No assets yet.
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="v-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`v-tab${activeTab === t.id ? ' active' : ''}`}
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                <span className="count">{counts[t.id] ?? 0}</span>
              </button>
            ))}
            <div className="v-tabs-trail">
              <button className="v-btn v-btn-sm v-btn-ghost">
                <Icon name="search" size={14} /> Search
              </button>
            </div>
          </div>

          {/* Asset list */}
          <AssetTable
            assets={assets}
            category={activeTab}
            hideValues={hideValues}
            mode={modes[activeTab]}
            onModeChange={(m) => setModes((prev) => ({ ...prev, [activeTab]: m }))}
          />
        </>
      )}

      {showAddModal && (
        <AddAssetModal
          onClose={() => setShowAddModal(false)}
          onAdd={(asset) => { addAsset(asset); setShowAddModal(false) }}
          defaultCategory={activeTab}
        />
      )}
    </main>
  )
}
