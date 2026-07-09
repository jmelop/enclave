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
  symbol?: string
  price?: number
  quantity?: number
  changePercent24h?: number
  isin?: string
  ter?: number
  distribution?: 'Acc' | 'Dist'
  amount?: number
  institution?: string
  apy?: number
  subtype?: string
  valuationDate?: string
}

export interface DbClient {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  release(): void;
}

export interface DbPool {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  connect(): Promise<DbClient>;
}

export type AssetInput = Omit<Asset, 'id'>
