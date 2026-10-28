import type { ItemStatus } from '@/types/inventory'

export const DEFAULT_LOW_THRESHOLD = 3

export function deriveStatus(qty: number, lowThreshold = DEFAULT_LOW_THRESHOLD): ItemStatus {
  if (qty === 0) return 'out'
  if (qty <= lowThreshold) return 'low'
  return 'in'
}

const eur = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' })

export function formatPrice(n: number): string {
  return eur.format(n)
}

// '' → null (no price); accepts a decimal comma. Returns undefined when the text is not a valid price.
export function parsePrice(text: string): number | null | undefined {
  const t = text.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function padId(n: number): string {
  return String(n).padStart(3, '0')
}

export function catDot(hue: number) {
  return `oklch(0.78 0.16 ${hue})`
}

export function catBg(hue: number) {
  return `oklch(0.72 0.14 ${hue} / 0.14)`
}

export function catFg(hue: number) {
  return `oklch(0.86 0.06 ${hue})`
}

export function catBorder(hue: number) {
  return `oklch(0.72 0.14 ${hue} / 0.28)`
}

export function catAccent(hue: number) {
  return `oklch(0.78 0.16 ${hue})`
}
