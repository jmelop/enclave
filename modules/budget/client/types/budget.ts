export type CategoryId =
  | 'food'
  | 'transport'
  | 'housing'
  | 'health'
  | 'entertainment'
  | 'subscriptions'
  | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  icon: string; // lucide icon name
}

export interface Transaction {
  id: string;
  name: string;
  vendor: string;
  amount: number;
  cat: CategoryId;
  day: number;
  monthKey: string;
  recurring?: boolean;
  manual?: boolean;
}

export interface RecurringBill {
  id: string;
  name: string;
  vendor: string;
  amount: number;
  cat: CategoryId;
  day: number;
  variable?: boolean;
}

export interface MonthData {
  key: string;     // 'YYYY-MM'
  label: string;   // 'January'
  year: number;
  income: number;
  spent: Record<CategoryId, number>;
  asOfDay: number;
  extra: Transaction[];
  note?: string;
}

export interface CategoryMetrics extends Category {
  spent: number;
  budget: number;
  ratio: number;
}

export interface MonthMetrics {
  spent: number;
  income: number;
  totalBudget: number;
  remaining: number;
  pctOfBudget: number;
  projected: number;
  safeToSpend: number;
  daysInMonth: number;
  daysRemaining: number;
  inProgress: boolean;
  cats: CategoryMetrics[];
}
