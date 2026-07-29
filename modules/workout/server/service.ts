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
  spanDays: number | null
  /** cm of waist per kg of bodyweight gained. Low = the gain is mostly muscle. */
  waistPerKg: number | null
  daysSinceWeight: number | null
  daysSinceWaist: number | null
  daysSinceSession: number | null
}

export interface BodyResponse<E> {
  entries: E[]
  trend: TrendPoint[]
  summary: BodySummary
}

export interface SetRow { reps: number; kg: number }
export interface ExerciseRow { name: string; sets: SetRow[] }
export interface SessionRow { id: string; date: string; name: string; exercises: ExerciseRow[] }

export interface SessionsSummary {
  sessionsThisMonth: number
  sessionsLastMonth: number | null
  volumeThisWeek: number
  volumeLastWeek: number | null
  currentStreak: number
  topSetThisWeek: { exercise: string; kg: number; reps: number } | null
  mostFrequentExercise: { name: string; count: number } | null
}

export interface SessionsResponse<S> {
  sessions: S[]
  summary: SessionsSummary
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

// Monday-based week index. Day 0 (1970-01-01) was a Thursday, hence the +3.
function weekIndex(iso: string): number {
  return Math.floor((dayNumber(iso) + 3) / 7)
}

function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

function previousMonthKey(iso: string): string {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, '0')}`
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

export function exerciseVolume(sets: SetRow[]): number {
  return Math.round(sets.reduce((sum, s) => sum + (s.reps || 0) * (s.kg || 0), 0))
}

export function sessionVolume(exercises: ExerciseRow[]): number {
  return Math.round(exercises.reduce((sum, ex) => sum + exerciseVolume(ex.sets), 0))
}

// Consecutive training weeks, counted back from the last week that HAS a session
// so an untrained Monday doesn't break it. One full empty natural week does.
export function currentStreak(sessions: SessionRow[], today: string): number {
  const weeks = new Set(sessions.map(s => weekIndex(s.date)))
  if (weeks.size === 0) return 0

  const lastActive = Math.max(...weeks)
  if (weekIndex(today) - lastActive >= 2) return 0

  let streak = 0
  for (let w = lastActive; weeks.has(w); w--) streak++
  return streak
}

function topSetOfWeek(
  sessions: SessionRow[],
  week: number,
): SessionsSummary['topSetThisWeek'] {
  // Heaviest kg, then most reps at that kg. 125x5 and 125x3 are not the same top
  // set — e1RM ranks them apart, and both must point at the same one.
  let best: SessionsSummary['topSetThisWeek'] = null
  for (const s of sessions) {
    if (weekIndex(s.date) !== week) continue
    for (const ex of s.exercises)
      for (const set of ex.sets)
        if (!best || set.kg > best.kg || (set.kg === best.kg && set.reps > best.reps))
          best = { exercise: ex.name, kg: set.kg, reps: set.reps }
  }
  return best
}

function mostFrequentOfMonth(
  sessions: SessionRow[],
  month: string,
): SessionsSummary['mostFrequentExercise'] {
  const counts = new Map<string, number>()
  for (const s of sessions) {
    if (monthKey(s.date) !== month) continue
    for (const ex of s.exercises) counts.set(ex.name, (counts.get(ex.name) ?? 0) + 1)
  }
  let best: SessionsSummary['mostFrequentExercise'] = null
  for (const [name, count] of counts) if (!best || count > best.count) best = { name, count }
  return best
}

function volumeOfWeek(sessions: SessionRow[], week: number): number {
  return sessions
    .filter(s => weekIndex(s.date) === week)
    .reduce((sum, s) => sum + sessionVolume(s.exercises), 0)
}

// Single assembly point for GET /sessions, shared by the DB and seed paths.
export function buildSessionsResponse<S extends SessionRow>(
  sessions: S[],
  today: string,
): SessionsResponse<
  S & { volume: number; setCount: number; exercises: (ExerciseRow & { volume: number })[] }
> {
  const thisWeek = weekIndex(today)
  const thisMonth = monthKey(today)
  const any = sessions.length > 0

  return {
    sessions: sessions.map(s => ({
      ...s,
      volume: sessionVolume(s.exercises),
      setCount: s.exercises.reduce((n, ex) => n + ex.sets.length, 0),
      exercises: s.exercises.map(ex => ({ ...ex, volume: exerciseVolume(ex.sets) })),
    })),
    summary: {
      sessionsThisMonth: sessions.filter(s => monthKey(s.date) === thisMonth).length,
      // null rather than 0 when there is nothing at all to compare against.
      sessionsLastMonth: any
        ? sessions.filter(s => monthKey(s.date) === previousMonthKey(today)).length
        : null,
      volumeThisWeek: volumeOfWeek(sessions, thisWeek),
      volumeLastWeek: any ? volumeOfWeek(sessions, thisWeek - 1) : null,
      currentStreak: currentStreak(sessions, today),
      topSetThisWeek: topSetOfWeek(sessions, thisWeek),
      mostFrequentExercise: mostFrequentOfMonth(sessions, thisMonth),
    },
  }
}

// cm of waist per kg of bodyweight. Needs two weights and two waist readings,
// and a non-zero weight change to divide by.
function waistPerKg(
  first: BodyRow | undefined,
  last: BodyRow | undefined,
  firstWaist: BodyRow | undefined,
  lastWaist: BodyRow | undefined,
): number | null {
  if (!first || !last || !firstWaist || !lastWaist) return null
  if (firstWaist === lastWaist) return null
  const dWeight = last.weight - first.weight
  if (dWeight === 0) return null
  return round2(((lastWaist.waist as number) - (firstWaist.waist as number)) / dWeight)
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
  const firstWaist = entries.find(e => e.waist != null)
  const lastWaist = [...entries].reverse().find(e => e.waist != null)
  // A span, like a delta, needs two distinct points.
  const spanned = first && last && entries.length > 1

  return {
    entries,
    trend,
    summary: {
      count: entries.length,
      minWeight: weights.length > 0 ? Math.min(...weights) : null,
      maxWeight: weights.length > 0 ? Math.max(...weights) : null,
      totalDelta: spanned ? round2(last.weight - first.weight) : null,
      spanDays: spanned ? daysBetween(first.date, last.date) : null,
      waistPerKg: waistPerKg(first, last, firstWaist, lastWaist),
      ...freshness(today, last?.date ?? null, lastWaist?.date ?? null, lastSessionDate),
    },
  }
}
