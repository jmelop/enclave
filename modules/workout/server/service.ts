// Derived workout metrics. Pure functions over plain rows — no Express, no pool.
// Both the DB rows and the seed fallback go through here, so the response shape
// is identical either way and the fallback can't mask a shape bug.

export interface BodyRow {
  date: string
  weight: number
  waist?: number
}

export interface TrendPoint {
  date: string
  weight: number
  ma7: number | null
  ma7Partial: boolean
  ma7Count: number
  waist: number | null
  deltaWeight: number | null
}

export interface BodySummary {
  count: number
  minWeight: number | null
  maxWeight: number | null
  totalDelta: number | null
  daysSinceWeight: number | null
  daysSinceWaist: number | null
  daysSinceSession: number | null
}

export interface BodyResponse<E> {
  entries: E[]
  trend: TrendPoint[]
  summary: BodySummary
}

const MA_WINDOW_DAYS = 7
// Below this many entries the trend line is not drawn at all.
const MA_MIN_ENTRIES = 4
// A window holding fewer than this many samples is flagged partial: after a
// long gap the "average" would just be one raw reading wearing a trend's coat.
const MA_MIN_SAMPLES = 3

// Day index from a YYYY-MM-DD string via Date.UTC, so differences never depend
// on the process timezone.
function dayNumber(iso: string): number {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  const d = Number(iso.slice(8, 10))
  return Math.round(Date.UTC(y, m - 1, d) / 86400000)
}

export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Rows must be date-ascending. Window is 7 calendar days, not 7 samples: with
// irregular logging a sample window would stretch a "weekly" trend over weeks.
export function movingAverage(
  rows: BodyRow[],
): { ma7: number | null; ma7Partial: boolean; ma7Count: number }[] {
  if (rows.length === 0) return []

  const days = rows.map(r => dayNumber(r.date))
  const firstDay = days[0] as number
  const enoughEntries = rows.length >= MA_MIN_ENTRIES

  return rows.map((_, i) => {
    const end = days[i] as number
    const start = end - (MA_WINDOW_DAYS - 1)

    let sum = 0
    let count = 0
    for (let j = i; j >= 0; j--) {
      if ((days[j] as number) < start) break
      sum += (rows[j] as BodyRow).weight
      count++
    }

    if (!enoughEntries) return { ma7: null, ma7Partial: true, ma7Count: count }

    return {
      ma7: round2(sum / count),
      ma7Partial: start < firstDay || count < MA_MIN_SAMPLES,
      ma7Count: count,
    }
  })
}

// Change against the previous entry. The first point has nothing to compare to.
export function weightDeltas(rows: BodyRow[]): (number | null)[] {
  return rows.map((r, i) => {
    const prev = rows[i - 1]
    return prev ? round2(r.weight - prev.weight) : null
  })
}

export function freshness(
  today: string,
  lastWeightDate: string | null,
  lastWaistDate: string | null,
  lastSessionDate: string | null,
): Pick<BodySummary, 'daysSinceWeight' | 'daysSinceWaist' | 'daysSinceSession'> {
  const since = (d: string | null) => (d === null ? null : daysBetween(d, today))
  return {
    daysSinceWeight: since(lastWeightDate),
    daysSinceWaist: since(lastWaistDate),
    daysSinceSession: since(lastSessionDate),
  }
}

// Single assembly point for GET /body, shared by the DB and seed paths.
export function buildBodyResponse<E extends BodyRow>(
  entries: E[],
  lastSessionDate: string | null,
  today: string,
): BodyResponse<E> {
  const ma = movingAverage(entries)
  const deltas = weightDeltas(entries)

  const trend: TrendPoint[] = entries.map((e, i) => ({
    date: e.date,
    weight: e.weight,
    ma7: (ma[i] as { ma7: number | null }).ma7,
    ma7Partial: (ma[i] as { ma7Partial: boolean }).ma7Partial,
    ma7Count: (ma[i] as { ma7Count: number }).ma7Count,
    waist: e.waist ?? null,
    deltaWeight: deltas[i] ?? null,
  }))

  const weights = entries.map(e => e.weight)
  const first = entries[0]
  const last = entries[entries.length - 1]
  const lastWaist = [...entries].reverse().find(e => e.waist != null)

  return {
    entries,
    trend,
    summary: {
      count: entries.length,
      minWeight: weights.length > 0 ? Math.min(...weights) : null,
      maxWeight: weights.length > 0 ? Math.max(...weights) : null,
      // A delta needs two distinct points; one entry is not a trend.
      totalDelta: first && last && entries.length > 1 ? round2(last.weight - first.weight) : null,
      ...freshness(today, last?.date ?? null, lastWaist?.date ?? null, lastSessionDate),
    },
  }
}
