export type WorkoutSet = { reps: number; kg: number }
export type Exercise = { name: string; sets: WorkoutSet[]; volume: number }
export type WorkoutSession = {
  id: string
  date: string
  name: string
  exercises: Exercise[]
  volume: number
}

// Write shape: volume is server-derived, so it is never sent.
export type SessionInput = {
  date: string
  name: string
  exercises: { name: string; sets: WorkoutSet[] }[]
}

export type SessionsSummary = {
  sessionsThisMonth: number
  sessionsLastMonth: number | null
  volumeThisWeek: number
  volumeLastWeek: number | null
  currentStreak: number
  topSetThisWeek: { exercise: string; kg: number; reps: number } | null
  mostFrequentExercise: { name: string; count: number } | null
}
export type SessionsResponse = {
  sessions: WorkoutSession[]
  summary: SessionsSummary
}
// Derived by the server (workout/server/service.ts) — never recomputed here.
export type TrendPoint = {
  date: string
  weight: number
  ma7: number | null
  ma7Partial: boolean
  ma7Count: number
  waist: number | null
  deltaWeight: number | null
}
export type BodySummary = {
  count: number
  minWeight: number | null
  maxWeight: number | null
  totalDelta: number | null
  spanDays: number | null
  daysSinceWeight: number | null
  daysSinceWaist: number | null
  daysSinceSession: number | null
}
export type BodyResponse = {
  entries: BodyEntry[]
  trend: TrendPoint[]
  summary: BodySummary
}
export type BodyEntry = {
  id: string
  date: string
  weight: number
  waist?: number
  chest?: number
  hip?: number
  bicepL?: number
  bicepR?: number
  thighL?: number
  thighR?: number
  notes?: string
}
