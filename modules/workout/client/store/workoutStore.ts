import { create } from 'zustand'
import type { BodyEntry, BodyResponse, SessionInput, SessionsResponse } from '../types/workout'

const EMPTY_SESSIONS: SessionsResponse = {
  sessions: [],
  summary: {
    sessionsThisMonth: 0, sessionsLastMonth: null,
    volumeThisWeek: 0, volumeLastWeek: null,
    currentStreak: 0, topSetThisWeek: null, mostFrequentExercise: null,
  },
}

const EMPTY_BODY: BodyResponse = {
  entries: [],
  trend: [],
  summary: {
    count: 0, minWeight: null, maxWeight: null, totalDelta: null, spanDays: null,
    weeklyDelta: null, waistPerKg: null,
    daysSinceWeight: null, daysSinceWaist: null, daysSinceSession: null,
  },
}

const BASE = '/api/workout'

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = (await res.json()) as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

interface WorkoutState {
  workouts: SessionsResponse
  body: BodyResponse

  loading: boolean
  error: string | null
  hydrated: boolean

  hydrate: () => Promise<void>
  refetch: () => Promise<void>

  addSession: (s: SessionInput) => Promise<void>
  updateSession: (id: string, s: SessionInput) => Promise<void>
  deleteSession: (id: string) => Promise<void>

  addBodyEntry: (e: Omit<BodyEntry, 'id'>) => Promise<void>
  updateBodyEntry: (id: string, e: Omit<BodyEntry, 'id'>) => Promise<void>
  deleteBodyEntry: (id: string) => Promise<void>
}

async function fetchAll() {
  const [workouts, body] = await Promise.all([
    apiFetch<SessionsResponse>(`${BASE}/sessions`),
    apiFetch<BodyResponse>(`${BASE}/body`),
  ])
  return { workouts, body }
}

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  workouts: EMPTY_SESSIONS,
  body: EMPTY_BODY,

  loading: false,
  error: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated || get().loading) return
    set({ loading: true, error: null })
    try {
      const data = await fetchAll()
      set({ ...data, hydrated: true, loading: false, error: null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error', loading: false })
    }
  },

  refetch: async () => {
    try {
      const data = await fetchAll()
      set({ ...data, hydrated: true, error: null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error' })
    }
  },

  addSession: async (s) => {
    await apiFetch(`${BASE}/sessions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    await get().refetch()
  },

  updateSession: async (id, s) => {
    await apiFetch(`${BASE}/sessions/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    await get().refetch()
  },

  deleteSession: async (id) => {
    const res = await fetch(`${BASE}/sessions/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await get().refetch()
  },

  addBodyEntry: async (e) => {
    await apiFetch(`${BASE}/body`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    })
    await get().refetch()
  },

  updateBodyEntry: async (id, e) => {
    await apiFetch(`${BASE}/body/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    })
    await get().refetch()
  },

  deleteBodyEntry: async (id) => {
    const res = await fetch(`${BASE}/body/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await get().refetch()
  },
}))
