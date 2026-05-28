import type { ItemStatus } from '@/types/inventory'

export function deriveStatus(qty: number): ItemStatus {
  if (qty === 0) return 'out'
  if (qty <= 3) return 'low'
  return 'in'
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
