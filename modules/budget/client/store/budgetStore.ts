import { create } from 'zustand';
import { SEED_MONTHS, SEED_RECURRING, DEFAULT_BUDGETS } from '@/lib/seed';
import type { CategoryId, MonthData, RecurringBill, Transaction } from '@/types/budget';

interface BudgetState {
  months: MonthData[];
  monthIndex: number;
  budgets: Record<CategoryId, number>;
  recurring: RecurringBill[];

  setMonthIndex: (i: number) => void;
  addExpense: (tx: Omit<Transaction, 'id' | 'monthKey'>) => void;
  deleteExpense: (id: string) => void;
  setBudget: (cat: CategoryId, amount: number) => void;
  addRecurring: (r: Omit<RecurringBill, 'id'>) => void;
  updateRecurring: (r: RecurringBill) => void;
  deleteRecurring: (id: string) => void;
}

const seedMonths = () =>
  SEED_MONTHS.map(m => ({ ...m, spent: { ...m.spent }, extra: [...m.extra] }));

export const useBudgetStore = create<BudgetState>((set, get) => ({
  months: seedMonths(),
  monthIndex: SEED_MONTHS.length - 1,
  budgets: { ...DEFAULT_BUDGETS },
  recurring: SEED_RECURRING.map(r => ({ ...r })),

  setMonthIndex: (i) => set({ monthIndex: i }),

  addExpense: (tx) => {
    const { months, monthIndex } = get();
    const month = months[monthIndex];
    const newTx: Transaction = {
      ...tx,
      id: `x-${Date.now()}`,
      monthKey: month.key,
      manual: true,
    };
    set({
      months: months.map((m, i) =>
        i !== monthIndex ? m : {
          ...m,
          spent: { ...m.spent, [tx.cat]: (m.spent[tx.cat] || 0) + tx.amount },
          extra: [...m.extra, newTx],
        },
      ),
    });
  },

  deleteExpense: (id) => {
    const { months, monthIndex } = get();
    const month = months[monthIndex];
    const ex = month.extra.find(e => e.id === id);
    if (!ex) return;
    set({
      months: months.map((m, i) =>
        i !== monthIndex ? m : {
          ...m,
          spent: { ...m.spent, [ex.cat]: Math.max(0, (m.spent[ex.cat] || 0) - ex.amount) },
          extra: m.extra.filter(e => e.id !== id),
        },
      ),
    });
  },

  setBudget: (cat, amount) =>
    set(s => ({ budgets: { ...s.budgets, [cat]: amount } })),

  addRecurring: (r) =>
    set(s => ({ recurring: [...s.recurring, { ...r, id: `r-${Date.now()}` }] })),

  updateRecurring: (r) =>
    set(s => ({ recurring: s.recurring.map(x => x.id === r.id ? r : x) })),

  deleteRecurring: (id) =>
    set(s => ({ recurring: s.recurring.filter(x => x.id !== id) })),
}));

export const useCurrentMonth = () => {
  const months = useBudgetStore(s => s.months);
  const monthIndex = useBudgetStore(s => s.monthIndex);
  return months[monthIndex];
};
