export type AssetCategory =
  | 'stock'
  | 'fund'
  | 'investment'
  | 'savings'
  | 'realestate'
  | 'collectible'
  | 'crypto'

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | string

export interface Asset {
  id: string
  type: AssetCategory
  name: string
  description?: string
  currency: Currency
  // Market assets (stock, fund, crypto)
  symbol?: string
  price?: number
  quantity?: number
  changePercent24h?: number
  // Fund extras
  isin?: string
  ter?: number
  distribution?: 'Acc' | 'Dist'
  // Manual assets
  amount?: number
  // Savings extras
  bank?: string
  apy?: number
  // Real estate / collectible / investment extras
  subtype?: string
  valuationDate?: string
}

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
