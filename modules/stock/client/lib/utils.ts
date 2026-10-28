const eur  = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const eur0 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export const fmt  = (v: number) => eur.format(v || 0)
export const fmt0 = (v: number) => eur0.format(Math.round(v || 0))
export const pct  = (ratio: number) => `${Math.round(ratio * 100)}%`
export const round2 = (v: number) => Math.round(v * 100) / 100

export function parsePlatforms(raw: string | null): string[] {
  return (raw ?? '').split(',').map((p) => p.trim()).filter(Boolean)
}

// Inverse of parsePlatforms: empty list is stored as NULL.
export function joinPlatforms(list: string[]): string | null {
  return list.length > 0 ? list.join(', ') : null
}

export function hasPlatform(list: string[], name: string): boolean {
  return list.some((p) => p.toLowerCase() === name.toLowerCase())
}

// Deterministic hue per platform name, so a platform keeps its color everywhere.
export function hueFor(name: string): number {
  let h = 7
  for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

// '2026-10-26T08:15:00.000Z' → '2026-10-26 09:15' (local time)
export function stamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
