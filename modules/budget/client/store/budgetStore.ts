import { create } from 'zustand'
import type { CategoryId, IncomeEntry, MonthData, RecurringBill, Transaction } from '@/types/budget'
import { SEED_MONTHS, SEED_RECURRING, DEFAULT_BUDGETS } from '@/lib/seed'

// ── Client-side date helpers ──────────────────────────────────────────────────

function daysInMonthClient(year: number, monthZero: number): number {
  return new Date(year, monthZero + 1, 0).getDate()
}

function labelFromKey(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long' })
}

function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function asOfDayClient(key: string): number {
  const [y, m] = key.split('-').map(Number)
  const maxDay = daysInMonthClient(y, m - 1)
  const today = new Date()
  const currentKey = monthKeyFromDate(today)
  if (key === currentKey) return today.getDate()
  if (key < currentKey) return maxDay
  return 0
}

export function currentMonthKey(): string {
  return monthKeyFromDate(new Date())
}

// ── Seed helpers ──────────────────────────────────────────────────────────────

function seedMonths(): MonthData[] {
  return SEED_MONTHS.map(m => ({ ...m, spent: { ...m.spent }, extra: [...m.extra] }))
}

// ── API fetch helpers ─────────────────────────────────────────────────────────

interface ApiMonthDetail {
  key: string
  income: number
  note: string
  asOfDay: number
  transactions: Transaction[]
  incomes?: IncomeEntry[]
  recurring: RecurringBill[]
  targets: Record<string, number>
  created?: boolean
}

interface ApiMonthSummary {
  key: string
  income: number
  note: string
  asOfDay: number
  spent: Record<string, number>
  created?: boolean
}

function emptySpent(): Record<CategoryId, number> {
  return {} as Record<CategoryId, number>
}

function januaryKey(year: number): string {
  return `${year}-01`
}

function addMonth(key: string): string {
  const [year, month] = key.split('-').map(Number)
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

function monthFromKey(key: string): MonthData {
  return {
    key,
    label: labelFromKey(key),
    year: parseInt(key.slice(0, 4)),
    income: 0,
    spent: emptySpent(),
    asOfDay: asOfDayClient(key),
    extra: [],
    created: false,
  }
}

function buildMonthTimeline(summaries: ApiMonthSummary[], floorYear: number): MonthData[] {
  const byKey = new Map(summaries.map(summary => [summary.key, summaryToMonthData(summary)]))
  const earliestExisting = summaries.reduce<string | null>(
    (earliest, summary) => (!earliest || summary.key < earliest ? summary.key : earliest),
    null,
  )
  const floorKey = januaryKey(Math.min(floorYear, new Date().getFullYear()))
  const startKey = earliestExisting && earliestExisting < floorKey
    ? earliestExisting
    : floorKey
  const endKey = currentMonthKey()
  const months: MonthData[] = []

  for (let key = startKey; key <= endKey; key = addMonth(key)) {
    months.push(byKey.get(key) ?? monthFromKey(key))
  }

  return months
}

async function fetchMonthDetail(key: string): Promise<ApiMonthDetail> {
  const res = await fetch(`/api/budget/months/${key}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as ApiMonthDetail
}

async function fetchMonthList(): Promise<ApiMonthSummary[]> {
  const res = await fetch('/api/budget/months')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as ApiMonthSummary[]
}

// Build a MonthData from a GET /months/:key detail response.
function detailToMonthData(d: ApiMonthDetail): MonthData {
  const spent: Record<string, number> = {}
  for (const tx of d.transactions) {
    spent[tx.cat] = (spent[tx.cat] || 0) + tx.amount
  }
  return {
    key:     d.key,
    label:   labelFromKey(d.key),
    year:    parseInt(d.key.slice(0, 4)),
    income:  d.income,
    spent:   spent as Record<CategoryId, number>,
    asOfDay: d.asOfDay,
    extra:   d.transactions.filter(t => t.manual),
    created: d.created ?? true,
    note:    d.note || undefined,
  }
}

// Build a lightweight MonthData from a GET /months summary entry.
function summaryToMonthData(s: ApiMonthSummary): MonthData {
  return {
    key:     s.key,
    label:   labelFromKey(s.key),
    year:    parseInt(s.key.slice(0, 4)),
    income:  s.income,
    spent:   s.spent as Record<CategoryId, number>,
    asOfDay: s.asOfDay,
    extra:   [],
    created: s.created ?? true,
    note:    s.note || undefined,
  }
}

// ── State shape ───────────────────────────────────────────────────────────────

interface BudgetState {
  months: MonthData[]
  monthIndex: number
  // Floor year for the navigable timeline — extends backward via setYear().
  earliestYear: number
  transactions: Transaction[]
  incomes: IncomeEntry[]
  recurring: RecurringBill[]
  budgets: Record<CategoryId, number>

  loading: boolean
  error: string | null
  hydrated: boolean

  hydrate: () => Promise<void>
  refetch: () => Promise<void>
  setMonthIndex: (i: number) => Promise<void>
  setYear: (year: number) => Promise<void>
  createMonth: (monthKey: string) => Promise<void>
  addExpense: (tx: Omit<Transaction, 'id' | 'monthKey'>) => Promise<void>
  updateExpense: (id: string, tx: Omit<Transaction, 'id' | 'monthKey'>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addIncome: (entry: Omit<IncomeEntry, 'id' | 'monthKey'>) => Promise<void>
  updateIncome: (id: string, entry: Omit<IncomeEntry, 'id' | 'monthKey'>) => Promise<void>
  deleteIncome: (id: string) => Promise<void>
  setBudget: (cat: CategoryId, amount: number) => Promise<void>
  addRecurring: (r: Omit<RecurringBill, 'id'>) => Promise<void>
  updateRecurring: (r: RecurringBill) => Promise<void>
  deleteRecurring: (id: string) => Promise<void>
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useBudgetStore = create<BudgetState>()((set, get) => ({
  months:       seedMonths(),
  monthIndex:   SEED_MONTHS.length - 1,
  earliestYear: new Date().getFullYear(),
  transactions: [],
  incomes:      [],
  recurring:    SEED_RECURRING.map(r => ({ ...r })),
  budgets:      { ...DEFAULT_BUDGETS },

  loading:  false,
  error:    null,
  hydrated: false,

  // ── hydration ──────────────────────────────────────────────────────────────

  hydrate: async () => {
    if (get().hydrated || get().loading) return
    set({ loading: true, error: null })
    try {
      const [summaries, detail] = await Promise.all([
        fetchMonthList(),
        fetchMonthDetail(currentMonthKey()),
      ])

      // Build a navigable month timeline (oldest first to match nav convention).
      const months = buildMonthTimeline(summaries, get().earliestYear)

      // Find or append current month in the list
      const curKey = detail.key
      const curIdx = months.findIndex(m => m.key === curKey)
      const curMonthData = detailToMonthData(detail)
      if (curIdx >= 0) {
        months[curIdx] = curMonthData
      } else {
        months.push(curMonthData)
      }

      const monthIndex = Math.max(0, months.findIndex(m => m.key === curKey))

      set({
        months,
        monthIndex,
        transactions: detail.transactions,
        incomes:      detail.incomes ?? [],
        recurring:    detail.recurring,
        budgets:      detail.targets as Record<CategoryId, number>,
        hydrated:     true,
        loading:      false,
        error:        null,
      })
    } catch (err) {
      set({
        error:   err instanceof Error ? err.message : 'Network error',
        hydrated: false,
        loading:  false,
      })
    }
  },

  refetch: async () => {
    const { months, monthIndex } = get()
    const key = months[monthIndex]?.key ?? currentMonthKey()
    set({ loading: true, error: null })
    try {
      const [summaries, detail] = await Promise.all([
        fetchMonthList(),
        fetchMonthDetail(key),
      ])

      const newMonths = buildMonthTimeline(summaries, get().earliestYear)
      const curIdx = newMonths.findIndex(m => m.key === detail.key)
      const curMonthData = detailToMonthData(detail)
      if (curIdx >= 0) newMonths[curIdx] = curMonthData
      else newMonths.push(curMonthData)
      const nextIndex = newMonths.findIndex(m => m.key === key)

      set({
        months:       newMonths,
        monthIndex:   nextIndex >= 0 ? nextIndex : Math.min(monthIndex, newMonths.length - 1),
        transactions: detail.transactions,
        incomes:      detail.incomes ?? [],
        recurring:    detail.recurring,
        budgets:      detail.targets as Record<CategoryId, number>,
        hydrated:     true,
        loading:      false,
        error:        null,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error', loading: false })
    }
  },

  setMonthIndex: async (i: number) => {
    const { months } = get()
    if (i < 0 || i >= months.length) return
    set({ monthIndex: i, loading: true, error: null })
    const key = months[i].key
    try {
      const detail = await fetchMonthDetail(key)
      const curMonthData = detailToMonthData(detail)
      const newMonths = [...get().months]
      newMonths[i] = curMonthData
      set({
        months:       newMonths,
        transactions: detail.transactions,
        incomes:      detail.incomes ?? [],
        recurring:    detail.recurring,
        budgets:      detail.targets as Record<CategoryId, number>,
        loading:      false,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Network error', loading: false })
    }
  },

  setYear: async (year: number) => {
    const { months, monthIndex, earliestYear } = get()
    if (year > new Date().getFullYear() || months.length === 0) return

    // Extend the timeline backward with empty months so the target year is
    // fully navigable from January.
    let newMonths = months
    if (januaryKey(year) < months[0].key) {
      const prefix: MonthData[] = []
      for (let key = januaryKey(year); key < months[0].key; key = addMonth(key)) {
        prefix.push(monthFromKey(key))
      }
      newMonths = [...prefix, ...months]
    }
    if (newMonths !== months || year < earliestYear) {
      set({ months: newMonths, earliestYear: Math.min(earliestYear, year) })
    }

    // Land on the same month number in the target year, clamped to the timeline.
    const monthPart = months[monthIndex]?.key.slice(5, 7) ?? '01'
    let targetKey = `${year}-${monthPart}`
    const firstKey = newMonths[0].key
    const lastKey = newMonths[newMonths.length - 1].key
    if (targetKey < firstKey) targetKey = firstKey
    if (targetKey > lastKey) targetKey = lastKey
    const idx = newMonths.findIndex(m => m.key === targetKey)
    if (idx >= 0) await get().setMonthIndex(idx)
  },

  // ── mutations ──────────────────────────────────────────────────────────────

  createMonth: async (monthKey) => {
    const res = await fetch(`/api/budget/months/${monthKey}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  addExpense: async (tx) => {
    const { months, monthIndex } = get()
    const monthKey = months[monthIndex]?.key ?? currentMonthKey()
    const res = await fetch('/api/budget/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tx, cat: tx.cat, monthKey }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  updateExpense: async (id, tx) => {
    const { months, monthIndex } = get()
    const monthKey = months[monthIndex]?.key ?? currentMonthKey()
    const res = await fetch(`/api/budget/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tx, cat: tx.cat, monthKey }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  deleteExpense: async (id: string) => {
    const res = await fetch(`/api/budget/transactions/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  setBudget: async (cat, amount) => {
    const res = await fetch(`/api/budget/targets/${cat}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  addRecurring: async (r) => {
    const res = await fetch('/api/budget/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  updateRecurring: async (r) => {
    const res = await fetch(`/api/budget/recurring/${r.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  deleteRecurring: async (id) => {
    const res = await fetch(`/api/budget/recurring/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  addIncome: async (entry) => {
    const { months, monthIndex } = get()
    const monthKey = months[monthIndex]?.key ?? currentMonthKey()
    const res = await fetch('/api/budget/incomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, monthKey }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  updateIncome: async (id, entry) => {
    const { months, monthIndex } = get()
    const monthKey = months[monthIndex]?.key ?? currentMonthKey()
    const res = await fetch(`/api/budget/incomes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, monthKey }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },

  deleteIncome: async (id: string) => {
    const res = await fetch(`/api/budget/incomes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }
    await get().refetch()
  },
}))

// ── Derived selectors ─────────────────────────────────────────────────────────

export function useCurrentMonth(): MonthData {
  const months      = useBudgetStore(s => s.months)
  const monthIndex  = useBudgetStore(s => s.monthIndex)
  const transactions = useBudgetStore(s => s.transactions)

  const base = months[monthIndex]
  if (!base) {
    const key = currentMonthKey()
    return {
      key,
      label:   new Date().toLocaleString('en-US', { month: 'long' }),
      year:    new Date().getFullYear(),
      income:  0,
      spent:   {} as Record<CategoryId, number>,
      asOfDay: asOfDayClient(key),
      extra:   [],
      created: false,
    }
  }

  // Re-derive spent + extra from the live transaction list so they stay in sync.
  const spent: Record<string, number> = {}
  for (const tx of transactions) {
    spent[tx.cat] = (spent[tx.cat] || 0) + tx.amount
  }
  const extra = transactions.filter(t => t.manual)

  return { ...base, spent: spent as Record<CategoryId, number>, extra }
}
