import type { WorkoutSession } from '../types/workout'

export function workoutVolume(w: WorkoutSession): number {
  let total = 0
  for (const ex of w.exercises)
    for (const s of ex.sets) total += (s.reps || 0) * (s.kg || 0)
  return Math.round(total)
}

export function formatDate(iso: string, opts: { short?: boolean } = {}): string {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (opts.short) return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]}`
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function dayOfWeek(iso: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(iso + 'T00:00:00').getDay()]
}

export function currentStreak(sessions: WorkoutSession[]): number {
  const weeks = new Set(sessions.map(w => {
    const d = new Date(w.date + 'T00:00:00')
    const year = d.getFullYear()
    const first = new Date(year, 0, 1)
    const week = Math.ceil(((d.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7)
    return `${year}-${week}`
  }))
  return weeks.size
}

export function sessionsThisMonth(sessions: WorkoutSession[]): number {
  const now = new Date()
  return sessions.filter(w => {
    const d = new Date(w.date + 'T00:00:00')
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
}

export function volumeThisWeek(sessions: WorkoutSession[]): number {
  const now = new Date('2026-05-24')
  const weekStart = new Date(now)
  const dow = now.getDay() === 0 ? 7 : now.getDay()
  weekStart.setDate(now.getDate() - dow + 1)
  weekStart.setHours(0, 0, 0, 0)
  return sessions
    .filter(w => new Date(w.date + 'T00:00:00') >= weekStart)
    .reduce((sum, w) => sum + workoutVolume(w), 0)
}
