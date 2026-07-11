import type { Asset, AssetCategory, Currency, AssetInput } from '@enclave/sdk'

export type { Asset, AssetCategory, Currency, AssetInput }

export interface AllocationTarget {
  category: AssetCategory
  targetPct: number
}

export interface FXRate {
  from: Currency
  to: 'EUR'
  rate: number
}

export interface PortfolioState {
  assets: Asset[]
  targets: AllocationTarget[]
  fxRates: FXRate[]
  lastSync: string
}

export interface PortfolioSnapshot {
  monthKey: string
  label: string
  year: number
  snapshotDate: string
  totalValue: number
  assetCount: number
  note?: string
}
