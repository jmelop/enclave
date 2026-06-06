import { create } from 'zustand'
import type { Goal, Plan, Result, Intel } from '@/types/strategy'

const BASE = '/api/strategy'

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = (await res.json()) as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

interface StrategyState {
  goals:   Goal[]
  plans:   Plan[]
  results: Result[]
  intel:   Intel[]

  loading:  boolean
  error:    string | null
  hydrated: boolean

  hydrate:  () => Promise<void>
  refetch:  () => Promise<void>

  addGoal:    (g: Omit<Goal,   'id'>) => Promise<void>
  addPlan:    (p: Omit<Plan,   'id'>) => Promise<void>
  addResult:  (r: Omit<Result, 'id'>) => Promise<void>
  addIntel:   (i: Omit<Intel,  'id'>) => Promise<void>

  updateGoal:   (id: string, g: Omit<Goal,   'id'>) => Promise<void>
  updatePlan:   (id: string, p: Omit<Plan,   'id'>) => Promise<void>
  updateResult: (id: string, r: Omit<Result, 'id'>) => Promise<void>
  updateIntel:  (id: string, i: Omit<Intel,  'id'>) => Promise<void>

  deleteGoal:   (id: string) => Promise<void>
  deletePlan:   (id: string) => Promise<void>
  deleteResult: (id: string) => Promise<void>
  deleteIntel:  (id: string) => Promise<void>

  togglePlan: (id: string) => Promise<void>
  // Signature change from reorderPlans(dragId, targetId).
  // Now calls PATCH /plans/reorder with the new position array.
  reorderPlans: (goalId: string, orderedIds: string[]) => Promise<void>
}

async function fetchAll() {
  const [goals, plans, results, intel] = await Promise.all([
    apiFetch<Goal[]>(`${BASE}/goals`),
    apiFetch<Plan[]>(`${BASE}/plans`),
    apiFetch<Result[]>(`${BASE}/results`),
    apiFetch<Intel[]>(`${BASE}/intel`),
  ])
  return { goals, plans, results, intel }
}

export const useStrategyStore = create<StrategyState>()((set, get) => ({
  goals:   [],
  plans:   [],
  results: [],
  intel:   [],

  loading:  false,
  error:    null,
  hydrated: false,

  // ── hydration ──────────────────────────────────────────────────────────────

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

  // ── add ────────────────────────────────────────────────────────────────────

  addGoal: async (g) => {
    await apiFetch(`${BASE}/goals`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g),
    })
    await get().refetch()
  },

  addPlan: async (p) => {
    await apiFetch(`${BASE}/plans`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    await get().refetch()
  },

  addResult: async (r) => {
    await apiFetch(`${BASE}/results`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    })
    await get().refetch()
  },

  addIntel: async (i) => {
    await apiFetch(`${BASE}/intel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(i),
    })
    await get().refetch()
  },

  // ── update ─────────────────────────────────────────────────────────────────

  updateGoal: async (id, g) => {
    await apiFetch(`${BASE}/goals/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g),
    })
    await get().refetch()
  },

  updatePlan: async (id, p) => {
    await apiFetch(`${BASE}/plans/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    await get().refetch()
  },

  updateResult: async (id, r) => {
    await apiFetch(`${BASE}/results/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    })
    await get().refetch()
  },

  updateIntel: async (id, i) => {
    await apiFetch(`${BASE}/intel/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(i),
    })
    await get().refetch()
  },

  // ── delete ─────────────────────────────────────────────────────────────────

  deleteGoal: async (id) => {
    const res = await fetch(`${BASE}/goals/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await get().refetch()
  },

  deletePlan: async (id) => {
    const res = await fetch(`${BASE}/plans/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await get().refetch()
  },

  deleteResult: async (id) => {
    const res = await fetch(`${BASE}/results/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await get().refetch()
  },

  deleteIntel: async (id) => {
    const res = await fetch(`${BASE}/intel/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await get().refetch()
  },

  // ── special plan actions ───────────────────────────────────────────────────

  togglePlan: async (id) => {
    await apiFetch(`${BASE}/plans/${id}/toggle`, { method: 'PATCH' })
    await get().refetch()
  },

  reorderPlans: async (goalId, orderedIds) => {
    await apiFetch(`${BASE}/plans/reorder`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, orderedIds }),
    })
    await get().refetch()
  },
}))
