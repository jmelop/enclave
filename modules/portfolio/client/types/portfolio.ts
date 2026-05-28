import type { Asset, AssetCategory, Currency } from '@enclave/sdk'

export type { Asset, AssetCategory, Currency }

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
