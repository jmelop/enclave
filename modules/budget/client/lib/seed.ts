import type { Category, CategoryId, MonthData, RecurringBill, Transaction } from '@/types/budget';

export const CATEGORIES: Category[] = [
  { id: 'food',          name: 'Food & Dining',  color: '#f59e0b', icon: 'utensils' },
  { id: 'transport',     name: 'Transport',       color: '#3b82f6', icon: 'car' },
  { id: 'housing',       name: 'Housing',         color: '#8b5cf6', icon: 'home' },
  { id: 'health',        name: 'Health',          color: '#10b981', icon: 'heart' },
  { id: 'entertainment', name: 'Entertainment',   color: '#f43f5e', icon: 'film' },
  { id: 'subscriptions', name: 'Subscriptions',   color: '#14b8a6', icon: 'repeat' },
  { id: 'other',         name: 'Other',           color: '#6b7280', icon: 'package' },
];

export const DEFAULT_BUDGETS: Record<CategoryId, number> = {
  food:          800,
  transport:     300,
  housing:       1500,
  health:        200,
  entertainment: 150,
  subscriptions: 100,
  other:         200,
};

export const SEED_RECURRING: RecurringBill[] = [
  { id: 'r1', name: 'Rent',          vendor: 'Property Mgmt',     amount: 1200,  cat: 'housing',       day: 1  },
  { id: 'r2', name: 'Netflix',       vendor: 'Netflix Inc.',       amount: 15.99, cat: 'subscriptions', day: 5  },
  { id: 'r3', name: 'Spotify',       vendor: 'Spotify AB',         amount: 10.99, cat: 'subscriptions', day: 5  },
  { id: 'r4', name: 'Gym',           vendor: 'FitLife Club',       amount: 45,    cat: 'health',        day: 10 },
  { id: 'r5', name: 'Internet',      vendor: 'ISP Corp',           amount: 60,    cat: 'housing',       day: 15 },
  { id: 'r6', name: 'Car Insurance', vendor: 'SafeDrive',          amount: 85,    cat: 'transport',     day: 20, variable: true },
  { id: 'r7', name: 'iCloud+',       vendor: 'Apple',              amount: 2.99,  cat: 'subscriptions', day: 28 },
];

// Variable transaction templates (day → repeatable each month)
const VAR_TEMPLATES: Omit<Transaction, 'id' | 'monthKey'>[] = [
  { name: 'Whole Foods',    vendor: 'Whole Foods Market',   amount: 124.50, cat: 'food',          day: 3,  manual: false },
  { name: 'Amazon',         vendor: 'Amazon.com',           amount: 67.40,  cat: 'other',         day: 4,  manual: false },
  { name: 'Cinema',         vendor: 'AMC Theatres',         amount: 32.00,  cat: 'entertainment', day: 5,  manual: false },
  { name: 'Gas Station',    vendor: 'Shell',                amount: 55.00,  cat: 'transport',     day: 6,  manual: false },
  { name: 'Uber Eats',      vendor: 'Uber Technologies',    amount: 34.20,  cat: 'food',          day: 7,  manual: false },
  { name: 'Pharmacy',       vendor: 'CVS Pharmacy',         amount: 42.30,  cat: 'health',        day: 8,  manual: false },
  { name: 'Coffee Lab',     vendor: 'Coffee Lab',           amount: 8.50,   cat: 'food',          day: 9,  manual: false },
  { name: 'Haircut',        vendor: 'Great Clips',          amount: 25.00,  cat: 'other',         day: 10, manual: false },
  { name: 'Lyft Ride',      vendor: 'Lyft Inc.',            amount: 24.80,  cat: 'transport',     day: 11, manual: false },
  { name: 'Trader Joe\'s',  vendor: 'Trader Joe\'s',        amount: 87.30,  cat: 'food',          day: 12, manual: false },
  { name: 'Steam Games',    vendor: 'Valve Corporation',    amount: 29.99,  cat: 'entertainment', day: 13, manual: false },
  { name: 'Doctor Visit',   vendor: 'Medical Associates',   amount: 80.00,  cat: 'health',        day: 14, manual: false },
  { name: 'Sushi Yoshi',    vendor: 'Sushi Yoshi',          amount: 62.00,  cat: 'food',          day: 15, manual: false },
  { name: 'Books',          vendor: 'Barnes & Noble',       amount: 38.00,  cat: 'other',         day: 17, manual: false },
  { name: 'Gas Station',    vendor: 'Chevron',              amount: 48.00,  cat: 'transport',     day: 18, manual: false },
  { name: 'Instacart',      vendor: 'Instacart',            amount: 98.40,  cat: 'food',          day: 19, manual: false },
  { name: 'Concert Tickets',vendor: 'Ticketmaster',         amount: 85.00,  cat: 'entertainment', day: 20, manual: false },
  { name: 'Supplements',    vendor: 'GNC',                  amount: 45.00,  cat: 'health',        day: 21, manual: false },
  { name: 'Chipotle',       vendor: 'Chipotle Mexican',     amount: 18.75,  cat: 'food',          day: 22, manual: false },
  { name: 'Parking',        vendor: 'Park & Ride',          amount: 32.00,  cat: 'transport',     day: 23, manual: false },
  { name: 'Amazon',         vendor: 'Amazon.com',           amount: 52.30,  cat: 'other',         day: 25, manual: false },
  { name: 'Grocery Run',    vendor: 'Safeway',              amount: 145.20, cat: 'food',          day: 26, manual: false },
  { name: 'Lyft',           vendor: 'Lyft Inc.',            amount: 18.40,  cat: 'transport',     day: 27, manual: false },
];

export function getTransactions(month: MonthData, recurring: RecurringBill[]): Transaction[] {
  const recurringTxs: Transaction[] = recurring
    .filter(r => r.day <= month.asOfDay)
    .map(r => ({
      id: `${month.key}-rec-${r.id}`,
      name: r.name,
      vendor: r.vendor,
      amount: r.amount,
      cat: r.cat,
      day: r.day,
      monthKey: month.key,
      recurring: true,
    }));

  const varTxs: Transaction[] = VAR_TEMPLATES
    .filter(t => t.day <= month.asOfDay)
    .map((t, i) => ({
      ...t,
      id: `${month.key}-var-${i}`,
      monthKey: month.key,
    }));

  const all = [
    ...month.extra,
    ...recurringTxs,
    ...varTxs,
  ];

  return all.sort((a, b) => b.day - a.day || b.amount - a.amount);
}

export const SEED_MONTHS: MonthData[] = [
  {
    key: '2025-11', label: 'November', year: 2025, income: 4500, asOfDay: 30, extra: [],
    spent: { food: 742, transport: 198, housing: 1260, health: 145, entertainment: 132, subscriptions: 88, other: 167 },
  },
  {
    key: '2025-12', label: 'December', year: 2025, income: 4800, asOfDay: 31, extra: [], note: 'Holidays',
    spent: { food: 956, transport: 245, housing: 1260, health: 78,  entertainment: 189, subscriptions: 88, other: 312 },
  },
  {
    key: '2026-01', label: 'January', year: 2026, income: 4500, asOfDay: 31, extra: [],
    spent: { food: 611, transport: 187, housing: 1260, health: 210, entertainment: 89,  subscriptions: 88, other: 143 },
  },
  {
    key: '2026-02', label: 'February', year: 2026, income: 4500, asOfDay: 28, extra: [],
    spent: { food: 698, transport: 221, housing: 1260, health: 155, entertainment: 143, subscriptions: 88, other: 198 },
  },
  {
    key: '2026-03', label: 'March', year: 2026, income: 4600, asOfDay: 31, extra: [],
    spent: { food: 789, transport: 267, housing: 1260, health: 188, entertainment: 167, subscriptions: 88, other: 221 },
  },
  {
    key: '2026-04', label: 'April', year: 2026, income: 4500, asOfDay: 30, extra: [],
    spent: { food: 654, transport: 203, housing: 1260, health: 134, entertainment: 112, subscriptions: 88, other: 156 },
  },
  {
    key: '2026-05', label: 'May', year: 2026, income: 4500, asOfDay: 30, extra: [],
    spent: { food: 543, transport: 178, housing: 1260, health: 110, entertainment: 87,  subscriptions: 88, other: 134 },
  },
];
