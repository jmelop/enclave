import { create } from 'zustand'
import type { WorkoutSession, BodyEntry } from '../types/workout'

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
  sessions: WorkoutSession[]
  bodyLog: BodyEntry[]

  loading: boolean
  error: string | null
  hydrated: boolean

  hydrate: () => Promise<void>
  refetch: () => Promise<void>

  addSession: (s: Omit<WorkoutSession, 'id'>) => Promise<void>
  updateSession: (id: string, s: Omit<WorkoutSession, 'id'>) => Promise<void>
  deleteSession: (id: string) => Promise<void>

  addBodyEntry: (e: Omit<BodyEntry, 'id'>) => Promise<void>
  updateBodyEntry: (id: string, e: Omit<BodyEntry, 'id'>) => Promise<void>
  deleteBodyEntry: (id: string) => Promise<void>
}

async function fetchAll() {
  const [sessions, bodyLog] = await Promise.all([
    apiFetch<WorkoutSession[]>(`${BASE}/sessions`),
    apiFetch<BodyEntry[]>(`${BASE}/body`),
  ])
  return { sessions, bodyLog }
}

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  sessions: [],
  bodyLog: [],

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
