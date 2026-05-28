import type { Asset, AssetCategory } from '../types/portfolio'

export const FX: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  CHF: 1.06,
}

export function assetValue(a: Asset): number {
  if (a.price != null && a.quantity != null) return a.price * a.quantity
  return a.amount ?? 0
}

export function assetValueEUR(a: Asset): number {
  const v = assetValue(a)
  const rate = FX[a.currency] ?? 1
  return v * rate
}

export function eur(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(n)
}

export function eurCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return '€' + (n / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(n) >= 1_000) return '€' + (n / 1_000).toFixed(1) + 'k'
  return eur(n)
}

export function num(n: number, d = 2): string {
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  }).format(n)
}

export function pct(n: number): string {
  return `${n >= 0 ? '+' : ''}${num(n, 2)}%`
}

export function pctRaw(n: number): string {
  return `${num(n, 1)}%`
}

export const CATEGORY_ORDER: AssetCategory[] = [
  'stock', 'fund', 'investment', 'savings', 'realestate', 'collectible', 'crypto',
]

export interface CategoryMeta {
  label: string
  short: string
  color: string
  pricing: 'auto' | 'manual'
}

export const CATEGORIES: Record<AssetCategory, CategoryMeta> = {
  realestate:  { label: 'Real Estate',           short: 'Real Estate',             color: '#b08968', pricing: 'manual' },
  collectible: { label: 'Metals & Collectibles',  short: 'Collectibles',            color: '#d4a574', pricing: 'manual' },
  crypto:      { label: 'Crypto',                 short: 'Crypto',                  color: '#f7a23a', pricing: 'auto'   },
  stock:       { label: 'Stocks',                 short: 'Stocks',                  color: '#5b9dff', pricing: 'auto'   },
  fund:        { label: 'Funds',                  short: 'Funds & ETFs',            color: '#5eead4', pricing: 'auto'   },
  savings:     { label: 'Savings',                short: 'Savings accounts',        color: '#86efac', pricing: 'manual' },
  investment:  { label: 'Investments',            short: 'Alternative investments', color: '#c4a3ff', pricing: 'manual' },
}

export const TARGETS: Record<AssetCategory, number> = {
  realestate: 30,
  collectible: 5,
  crypto: 10,
  stock: 15,
  fund: 25,
  savings: 10,
  investment: 5,
}

export const FX_COLORS: Record<string, string> = {
  EUR: 'var(--info)',
  USD: '#5eead4',
  GBP: '#c4a3ff',
  CHF: '#f7a23a',
}
