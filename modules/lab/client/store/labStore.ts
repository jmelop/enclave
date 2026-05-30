import { create } from 'zustand'
import type { Idea, PhaseId, CategoryId } from '@/types/lab'
import { SEED_IDEAS } from '@/lib/seed'
import { today } from '@/lib/utils'

interface LabState {
  ideas: Idea[]
  query: string
  phase: PhaseId | 'all'
  category: CategoryId | 'all'
  openId: string | null
  setQuery: (q: string) => void
  setPhase: (p: PhaseId | 'all') => void
  setCategory: (c: CategoryId | 'all') => void
  setOpenId: (id: string | null) => void
  updateIdea: (idea: Idea) => void
  newIdea: () => void
  setIdeaPhase: (id: string, phase: PhaseId) => void
}

let _counter = 0
function uid(): string {
  return `idea-${Date.now()}-${++_counter}`
}

export const useLabStore = create<LabState>((set) => ({
  ideas: SEED_IDEAS,
  query: '',
  phase: 'all',
  category: 'all',
  openId: null,

  setQuery: (q) => set({ query: q }),
  setPhase: (p) => set({ phase: p }),
  setCategory: (c) => set({ category: c }),
  setOpenId: (id) => set({ openId: id }),

  updateIdea: (idea) =>
    set((s) => ({
      ideas: s.ideas.map((i) => (i.id === idea.id ? { ...idea, updated: today() } : i)),
    })),

  newIdea: () => {
    const id = uid()
    const blank: Idea = {
      id,
      title: 'Nueva idea',
      category: 'dev',
      phase: 'spark',
      updated: today(),
      notes: '',
      links: [],
      snippets: [],
    }
    set((s) => ({ ideas: [blank, ...s.ideas], openId: id }))
  },

  setIdeaPhase: (id, phase) =>
    set((s) => ({
      ideas: s.ideas.map((i) =>
        i.id === id ? { ...i, phase, updated: today() } : i,
      ),
    })),
}))
