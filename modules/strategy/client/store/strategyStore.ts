import { create } from 'zustand'
import type { Goal, Plan, Retro, Intel } from '@/types/strategy'
import { GOALS, PLANS, RETROS, INTEL } from '@/lib/seed'

interface StrategyState {
  goals: Goal[]
  plans: Plan[]
  retros: Retro[]
  intel: Intel[]
  togglePlan: (id: string) => void
  reorderPlans: (dragId: string, targetId: string) => void
  addGoal: (g: Omit<Goal, 'id'>) => void
  addPlan: (p: Omit<Plan, 'id'>) => void
  addRetro: (r: Omit<Retro, 'id'>) => void
  addIntel: (i: Omit<Intel, 'id'>) => void
}

let _counter = 0
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${++_counter}`
}

export const useStrategyStore = create<StrategyState>((set) => ({
  goals: GOALS,
  plans: PLANS,
  retros: RETROS,
  intel: INTEL,

  togglePlan: (id) =>
    set((s) => ({
      plans: s.plans.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
    })),

  reorderPlans: (dragId, targetId) =>
    set((s) => {
      const plans = [...s.plans]
      const fromIdx = plans.findIndex((p) => p.id === dragId)
      const toIdx = plans.findIndex((p) => p.id === targetId)
      if (fromIdx === -1 || toIdx === -1) return {}
      const [item] = plans.splice(fromIdx, 1)
      plans.splice(toIdx, 0, item)
      return { plans }
    }),

  addGoal: (g) =>
    set((s) => ({
      goals: [...s.goals, { ...g, id: uid('g') }],
    })),

  addPlan: (p) =>
    set((s) => ({
      plans: [...s.plans, { ...p, id: uid('p') }],
    })),

  addRetro: (r) =>
    set((s) => ({
      retros: [...s.retros, { ...r, id: uid('r') }],
    })),

  addIntel: (i) =>
    set((s) => ({
      intel: [...s.intel, { ...i, id: uid('i') }],
    })),
}))
