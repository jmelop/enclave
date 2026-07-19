import { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react'
import { Button, useToast } from '@venator-ui/ui'
import { Icon } from '../components/Icon'
import { SummaryCards } from '../components/portfolio/SummaryCards'
import { AllocationWidget } from '../components/portfolio/AllocationWidget'
import { TargetVsCurrentWidget } from '../components/portfolio/TargetVsCurrentWidget'
import { FXExposureWidget } from '../components/portfolio/FXExposureWidget'
import { AssetTable } from '../components/portfolio/AssetTable'
import AddAssetModal from '../components/portfolio/AddAssetModal'
import { usePortfolioStore } from '../store/portfolioStore'
import { CATEGORIES, CATEGORY_ORDER } from '../lib/utils'
import type { Asset, AssetCategory, AssetInput } from '../types/portfolio'

type ModalState =
  | { mode: 'add'; category: AssetCategory }
  | { mode: 'edit'; asset: Asset }
  | null

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

const ASSET_CSV_HEADERS = [
  'id',
  'type',
  'name',
  'description',
  'currency',
  'symbol',
  'price',
  'quantity',
  'changePercent24h',
  'institution',
  'isin',
  'ter',
  'distribution',
  'amount',
  'subtype',
  'valuationDate',
  'apy',
] as const

type AssetCsvHeader = typeof ASSET_CSV_HEADERS[number]
type AssetCsvRow = Record<AssetCsvHeader, string>

interface AssetCsvImport {
  id?: string
  input: AssetInput
  rowNumber: number
}

const ASSET_CSV_HEADER_SET = new Set<string>(ASSET_CSV_HEADERS)

function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function buildAssetsCsv(assets: Asset[]): string {
  const rows = [
    ASSET_CSV_HEADERS.join(','),
    ...assets.map((asset) => ASSET_CSV_HEADERS
      .map((header) => csvEscape(asset[header as keyof Asset]))
      .join(',')),
  ]
  return rows.join('\r\n')
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }

  if (quoted) throw new Error('Invalid CSV: unclosed quote')
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((cells) => cells.some((value) => value.trim()))
}

function emptyCsvRow(): AssetCsvRow {
  return ASSET_CSV_HEADERS.reduce((row, header) => {
    row[header] = ''
    return row
  }, {} as AssetCsvRow)
}

function clean(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function numberFromCsv(value: string, field: string, rowNumber: number): number | undefined {
  const raw = clean(value)
  if (!raw) return undefined

  const parsed = Number(raw.replace(',', '.'))
  if (!Number.isFinite(parsed)) {
    throw new Error(`Row ${rowNumber}: ${field} must be a number`)
  }
  return parsed
}

function positiveNumberFromCsv(value: string, field: string, rowNumber: number): number {
  const parsed = numberFromCsv(value, field, rowNumber)
  if (parsed == null || parsed <= 0) {
    throw new Error(`Row ${rowNumber}: ${field} must be greater than 0`)
  }
  return parsed
}

function isAssetCategory(value: string): value is AssetCategory {
  return CATEGORY_ORDER.includes(value as AssetCategory)
}

function assetInputFromCsvRow(row: AssetCsvRow, rowNumber: number): AssetInput {
  const rawType = clean(row.type)
  if (!rawType || !isAssetCategory(rawType)) {
    throw new Error(`Row ${rowNumber}: invalid asset type`)
  }

  const currency = clean(row.currency)
  if (!currency) throw new Error(`Row ${rowNumber}: currency is required`)

  const institution = clean(row.institution)
  const rawName = clean(row.name)
  const name = rawName ?? (rawType === 'savings' ? institution : undefined)
  if (!name) throw new Error(`Row ${rowNumber}: name is required`)

  const input: AssetInput = {
    type: rawType,
    name,
    currency,
  }

  const description = clean(row.description)
  if (description) input.description = description
  if (institution) input.institution = institution

  if (rawType === 'crypto' || rawType === 'stock') {
    const symbol = clean(row.symbol)
    if (!symbol) throw new Error(`Row ${rowNumber}: symbol is required`)
    input.symbol = symbol.toUpperCase()
    input.price = numberFromCsv(row.price, 'price', rowNumber) ?? 0
    input.quantity = numberFromCsv(row.quantity, 'quantity', rowNumber) ?? 0
    input.changePercent24h = numberFromCsv(row.changePercent24h, 'changePercent24h', rowNumber) ?? 0
  } else if (rawType === 'fund') {
    const symbol = clean(row.symbol)
    if (!symbol) throw new Error(`Row ${rowNumber}: symbol is required`)
    input.symbol = symbol.toUpperCase()
    input.price = numberFromCsv(row.price, 'price', rowNumber) ?? 0
    input.quantity = numberFromCsv(row.quantity, 'quantity', rowNumber) ?? 0
    input.changePercent24h = numberFromCsv(row.changePercent24h, 'changePercent24h', rowNumber) ?? 0

    const isin = clean(row.isin)
    if (isin) input.isin = isin.toUpperCase()

    const ter = numberFromCsv(row.ter, 'ter', rowNumber)
    if (ter != null) input.ter = ter

    const distribution = clean(row.distribution) ?? 'Acc'
    if (distribution !== 'Acc' && distribution !== 'Dist') {
      throw new Error(`Row ${rowNumber}: distribution must be Acc or Dist`)
    }
    input.distribution = distribution
  } else if (rawType === 'savings') {
    input.amount = positiveNumberFromCsv(row.amount, 'amount', rowNumber)

    const apy = numberFromCsv(row.apy, 'apy', rowNumber)
    if (apy != null) input.apy = apy
  } else if (rawType === 'realestate') {
    input.amount = positiveNumberFromCsv(row.amount, 'amount', rowNumber)
    input.subtype = clean(row.subtype) ?? 'direct'
    input.valuationDate = clean(row.valuationDate) ?? new Date().toISOString().slice(0, 10)
  } else if (rawType === 'collectible') {
    input.amount = positiveNumberFromCsv(row.amount, 'amount', rowNumber)
    input.subtype = clean(row.subtype) ?? 'gold'
  } else if (rawType === 'investment') {
    input.amount = positiveNumberFromCsv(row.amount, 'amount', rowNumber)
    input.subtype = clean(row.subtype) ?? 'other'
  }

  return input
}

function parseAssetCsv(text: string): AssetCsvImport[] {
  const rows = parseCsvRows(text.replace(/^\ufeff/, ''))
  if (rows.length === 0) return []

  const headers = rows[0].map((header) => header.trim())
  const unknownHeader = headers.find((header) => header && !ASSET_CSV_HEADER_SET.has(header))
  if (unknownHeader) throw new Error(`Unknown CSV column: ${unknownHeader}`)

  const mappedHeaders = headers.map((header) =>
    ASSET_CSV_HEADER_SET.has(header) ? header as AssetCsvHeader : null
  )

  return rows.slice(1).reduce<AssetCsvImport[]>((imports, cells, index) => {
    const rowNumber = index + 2
    const row = emptyCsvRow()
    mappedHeaders.forEach((header, cellIndex) => {
      if (header) row[header] = cells[cellIndex] ?? ''
    })
    if (Object.values(row).every((value) => !value.trim())) return imports

    imports.push({
      id: clean(row.id),
      input: assetInputFromCsvRow(row, rowNumber),
      rowNumber,
    })
    return imports
  }, [])
}

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

export function Portfolio() {
  const { assets, loading, pricesLoading, error, hydrated, hydrate, refetch, refreshPrices, createAsset, updateAsset, deleteAsset } = usePortfolioStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<AssetCategory>('stock')
  const [hideValues, setHideValues] = useState(false)
  const [modes, setModes] = useState<Modes>(DEFAULT_MODES)
  const [modal, setModal] = useState<ModalState>(null)
  const [importing, setImporting] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()
  const { toast } = useToast()

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

  const handleExportAssets = () => {
    const csv = buildAssetsCsv(assets)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `portfolio-assets-${now}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    toast({
      title: `Exported ${assets.length} asset${assets.length === 1 ? '' : 's'}`,
      variant: 'success',
    })
  }

  const handleLivePrices = async () => {
    try {
      const { updated, failed } = await refreshPrices()
      if (updated === 0 && failed.length === 0) {
        toast({ title: 'No symbol-based assets to update', variant: 'default' })
      } else {
        toast({
          title: failed.length > 0
            ? `Prices updated: ${updated} asset${updated === 1 ? '' : 's'} · no quote for ${failed.join(', ')}`
            : `Prices updated: ${updated} asset${updated === 1 ? '' : 's'}`,
          variant: failed.length > 0 ? 'warning' : 'success',
        })
      }
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Could not refresh prices',
        variant: 'error',
      })
    }
  }

  const handleImportAssets = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const importedAssets = parseAssetCsv(await file.text())
      if (importedAssets.length === 0) {
        throw new Error('CSV has no assets to import')
      }

      let created = 0
      let updated = 0

      for (const asset of importedAssets) {
        try {
          if (asset.id) {
            await updateAsset(asset.id, asset.input)
            updated += 1
          } else {
            await createAsset(asset.input)
            created += 1
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error importing asset'
          throw new Error(`Row ${asset.rowNumber}: ${message}`)
        }
      }

      toast({
        title: `CSV processed: ${created} created, ${updated} updated`,
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Error importing CSV',
        variant: 'error',
      })
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

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
          <Button variant="secondary" size="sm" onClick={refetch}>
            <span className="p-action-icon"><Icon name="refresh" /></span>
            <span>Refresh</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            title="Fetch live prices for stocks, funds and crypto"
            onClick={handleLivePrices}
            disabled={pricesLoading}
          >
            <span className="p-action-icon"><Icon name="bolt" /></span>
            <span>{pricesLoading ? 'Updating' : 'Live'}</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportAssets}>
            <span className="p-action-icon"><Icon name="download" /></span>
            <span>Export</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <span className="p-action-icon"><Icon name="upload" /></span>
            <span>{importing ? 'Importing' : 'Import'}</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setModal({ mode: 'add', category: activeTab })}>
            <span className="p-action-icon"><Icon name="plus" /></span>
            <span>Add Asset</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportAssets}
            style={{ display: 'none' }}
          />
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
            onDelete={deleteAsset}
            onEdit={(asset) => setModal({ mode: 'edit', asset })}
          />
        </>
      )}

      {modal && (
        <AddAssetModal
          onClose={() => setModal(null)}
          onAdd={createAsset}
          onSave={updateAsset}
          defaultCategory={modal.mode === 'add' ? modal.category : undefined}
          editAsset={modal.mode === 'edit' ? modal.asset : undefined}
        />
      )}
    </main>
  )
}
