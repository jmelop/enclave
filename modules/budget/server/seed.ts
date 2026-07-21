// Fallback data served when the DB is empty or unavailable.
// Shape matches what the API returns (snake→camel resolved, category not cat).
// Historical months stay as front-only seed; only the current month gets a
// lightweight transaction set for the DB-down fallback on GET /months/:key.

export interface SeedRecurring {
  id: string
  name: string
  vendor: string
  amount: number
  cat: string
  day: number
  variable?: boolean
}

export interface SeedTransaction {
  id: string
  name: string
  vendor: string
  amount: number
  cat: string
  day: number
  monthKey: string
  recurring?: boolean
  manual?: boolean
}

export interface SeedMonthSummary {
  key: string
  income: number
  note: string
  asOfDay: number
  spent: Record<string, number>
}

export interface SeedCategory {
  id: string
  name: string
  color: string
  icon: string
}

export interface SeedMonthDetail extends SeedMonthSummary {
  transactions: SeedTransaction[]
  incomes: never[]
  recurring: SeedRecurring[]
  targets: Record<string, number>
  categories: SeedCategory[]
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { id: 'food',          name: 'Food & Dining', color: '#f59e0b', icon: 'utensils' },
  { id: 'transport',     name: 'Transport',     color: '#3b82f6', icon: 'car' },
  { id: 'housing',       name: 'Housing',       color: '#8b5cf6', icon: 'home' },
  { id: 'health',        name: 'Health',        color: '#10b981', icon: 'heart' },
  { id: 'entertainment', name: 'Entertainment', color: '#f43f5e', icon: 'film' },
  { id: 'subscriptions', name: 'Subscriptions', color: '#14b8a6', icon: 'repeat' },
  { id: 'other',         name: 'Other',         color: '#6b7280', icon: 'package' },
]

export const SEED_RECURRING: SeedRecurring[] = [
  { id: 'r1', name: 'Rent',          vendor: 'Property Mgmt',  amount: 1200,  cat: 'housing',       day: 1  },
  { id: 'r2', name: 'Netflix',       vendor: 'Netflix Inc.',    amount: 15.99, cat: 'subscriptions', day: 5  },
  { id: 'r3', name: 'Spotify',       vendor: 'Spotify AB',      amount: 10.99, cat: 'subscriptions', day: 5  },
  { id: 'r4', name: 'Gym',           vendor: 'FitLife Club',    amount: 45,    cat: 'health',        day: 10 },
  { id: 'r5', name: 'Internet',      vendor: 'ISP Corp',        amount: 60,    cat: 'housing',       day: 15 },
  { id: 'r6', name: 'Car Insurance', vendor: 'SafeDrive',       amount: 85,    cat: 'transport',     day: 20, variable: true },
  { id: 'r7', name: 'iCloud+',       vendor: 'Apple',           amount: 2.99,  cat: 'subscriptions', day: 28 },
]

export const SEED_TARGETS: Record<string, number> = {
  food: 800, transport: 300, housing: 1500,
  health: 200, entertainment: 150, subscriptions: 100, other: 200,
}

// Historical month summaries — front-only fallback for HistoryPage/TrendChart.
// Not materialized as transactions in the DB.
export const SEED_MONTH_SUMMARIES: SeedMonthSummary[] = [
  { key: '2025-11', income: 4500, note: '',        asOfDay: 30, spent: { food: 742, transport: 198, housing: 1260, health: 145, entertainment: 132, subscriptions: 88, other: 167 } },
  { key: '2025-12', income: 4800, note: 'Holidays', asOfDay: 31, spent: { food: 956, transport: 245, housing: 1260, health: 78,  entertainment: 189, subscriptions: 88, other: 312 } },
  { key: '2026-01', income: 4500, note: '',        asOfDay: 31, spent: { food: 611, transport: 187, housing: 1260, health: 210, entertainment: 89,  subscriptions: 88, other: 143 } },
  { key: '2026-02', income: 4500, note: '',        asOfDay: 28, spent: { food: 698, transport: 221, housing: 1260, health: 155, entertainment: 143, subscriptions: 88, other: 198 } },
  { key: '2026-03', income: 4600, note: '',        asOfDay: 31, spent: { food: 789, transport: 267, housing: 1260, health: 188, entertainment: 167, subscriptions: 88, other: 221 } },
  { key: '2026-04', income: 4500, note: '',        asOfDay: 30, spent: { food: 654, transport: 203, housing: 1260, health: 134, entertainment: 112, subscriptions: 88, other: 156 } },
  { key: '2026-05', income: 4500, note: '',        asOfDay: 30, spent: { food: 543, transport: 178, housing: 1260, health: 110, entertainment: 87,  subscriptions: 88, other: 134 } },
]

// Lightweight fallback transactions for the current month when DB is down.
// Only recurring bills (no variable templates).
export function buildSeedMonthDetail(monthKey: string): SeedMonthDetail {
  const summary = SEED_MONTH_SUMMARIES.find(m => m.key === monthKey)

  const transactions: SeedTransaction[] = SEED_RECURRING
    .filter(r => r.day <= (summary?.asOfDay ?? 30))
    .map(r => ({
      id: `seed-${monthKey}-${r.id}`,
      name: r.name,
      vendor: r.vendor,
      amount: r.amount,
      cat: r.cat,
      day: r.day,
      monthKey,
      recurring: true,
    }))

  return {
    key: monthKey,
    income: summary?.income ?? 0,
    note: summary?.note ?? '',
    asOfDay: summary?.asOfDay ?? new Date().getDate(),
    spent: summary?.spent ?? {},
    transactions,
    incomes: [],
    recurring: SEED_RECURRING,
    targets: SEED_TARGETS,
    categories: SEED_CATEGORIES,
  }
}
