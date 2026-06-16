import { create } from 'zustand'
import type { Idea, PhaseId, CategoryId, FlatSnippet } from '@/types/lab'

// ── fetch helpers ─────────────────────────────────────────────────────────────

async function fetchIdeas(): Promise<Idea[]> {
  const res = await fetch('/api/lab/ideas')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as Idea[]
}

async function fetchAllSnippets(): Promise<FlatSnippet[]> {
  const res = await fetch('/api/lab/snippets')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as FlatSnippet[]
}

// ── state shape ───────────────────────────────────────────────────────────────

interface LabState {
  ideas: Idea[]
  loading: boolean
  error: string | null
  hydrated: boolean

  allSnippets: FlatSnippet[]
  snippetsLoading: boolean
  snippetsError: string | null
  snippetsHydrated: boolean

  query: string
  phase: PhaseId | 'all'
  category: CategoryId | 'all'
  openId: string | null

  hydrate: () => Promise<void>
  refetch: () => Promise<void>
  hydrateSnippets: () => Promise<void>
  refetchSnippets: () => Promise<void>
  newIdea: () => Promise<void>
  updateIdea: (idea: Idea) => Promise<void>
  setIdeaPhase: (id: string, phase: PhaseId) => Promise<void>
  deleteIdea: (id: string) => Promise<void>

  setQuery: (q: string) => void
  setPhase: (p: PhaseId | 'all') => void
  setCategory: (c: CategoryId | 'all') => void
  setOpenId: (id: string | null) => void
}

// ── store ─────────────────────────────────────────────────────────────────────

export const useLabStore = create<LabState>()((set, get) => ({
  ideas: [],
  loading: false,
  error: null,
  hydrated: false,

  allSnippets: [],
  snippetsLoading: false,
  snippetsError: null,
  snippetsHydrated: false,

  query: '',
  phase: 'all',
  category: 'all',
  openId: null,

  // ── ideas hydration ──────────────────────────────────────────────────────

  hydrate: async () => {
    if (get().hydrated || get().loading) return
    set({ loading: true, error: null })
    try {
      const ideas = await fetchIdeas()
      set({ ideas, hydrated: true, error: null, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error', hydrated: false, loading: false })
    }
  },

  refetch: async () => {
    set({ loading: true, error: null })
    try {
      const ideas = await fetchIdeas()
      set({ ideas, hydrated: true, error: null, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error', loading: false })
    }
  },

  // ── snippets hydration ───────────────────────────────────────────────────

  hydrateSnippets: async () => {
    if (get().snippetsHydrated || get().snippetsLoading) return
    set({ snippetsLoading: true, snippetsError: null })
    try {
      const allSnippets = await fetchAllSnippets()
      set({ allSnippets, snippetsHydrated: true, snippetsError: null, snippetsLoading: false })
    } catch (err) {
      set({ snippetsError: err instanceof Error ? err.message : 'Network error', snippetsHydrated: false, snippetsLoading: false })
    }
  },

  refetchSnippets: async () => {
    set({ snippetsLoading: true, snippetsError: null })
    try {
      const allSnippets = await fetchAllSnippets()
      set({ allSnippets, snippetsHydrated: true, snippetsError: null, snippetsLoading: false })
    } catch (err) {
      set({ snippetsError: err instanceof Error ? err.message : 'Network error', snippetsLoading: false })
    }
  },

  // ── mutations ────────────────────────────────────────────────────────────

  newIdea: async () => {
    const res = await fetch('/api/lab/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New idea', category: 'dev', phase: 'spark', notes: '', links: [], snippets: [] }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    const created = (await res.json()) as Idea
    await get().refetch()
    set({ openId: created.id })
  },

  updateIdea: async (idea: Idea) => {
    const res = await fetch(`/api/lab/ideas/${idea.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
    if (get().snippetsHydrated) await get().refetchSnippets()
  },

  setIdeaPhase: async (id: string, phase: PhaseId) => {
    const idea = get().ideas.find(i => i.id === id)
    if (!idea) return
    await get().updateIdea({ ...idea, phase })
  },

  deleteIdea: async (id: string) => {
    const res = await fetch(`/api/lab/ideas/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  // ── ui state ─────────────────────────────────────────────────────────────

  setQuery:    (query)    => set({ query }),
  setPhase:    (phase)    => set({ phase }),
  setCategory: (category) => set({ category }),
  setOpenId:   (openId)   => set({ openId }),
}))
