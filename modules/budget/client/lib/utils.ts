import { CATEGORIES } from '@/lib/seed';
import type { CategoryId, MonthData, MonthMetrics } from '@/types/budget';

// Currency symbol chosen in the options module (mirrored to localStorage by
// the shell's applyEnclaveSettings); euro when unset or outside the browser.
function currency(): string {
  try { return localStorage.getItem('enclave-currency-symbol') ?? '€'; } catch { return '€'; }
}

export const fmt = (n: number): string =>
  currency() + Math.round(n).toLocaleString('en-US');

export const fmt2 = (n: number): string =>
  currency() + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtSigned = (n: number): string =>
  (n < 0 ? '−' : '+') + currency() + Math.abs(Math.round(n)).toLocaleString('en-US');

export const pct = (n: number): string => Math.round(n * 100) + '%';

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function computeMetrics(
  month: MonthData,
  budgets: Record<CategoryId, number>,
): MonthMetrics {
  const [yearStr, monthStr] = month.key.split('-');
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr) - 1;
  const days = daysInMonth(year, monthNum);
  const daysRemaining = Math.max(0, days - month.asOfDay);
  const inProgress = month.asOfDay < days;

  const totalSpent = (Object.keys(month.spent) as CategoryId[]).reduce(
    (s, k) => s + (month.spent[k] || 0), 0,
  );
  const totalBudget = (Object.keys(budgets) as CategoryId[]).reduce(
    (s, k) => s + (budgets[k] || 0), 0,
  );

  const dailyRate = month.asOfDay > 0 ? totalSpent / month.asOfDay : 0;
  const projected = inProgress ? totalSpent + dailyRate * daysRemaining : totalSpent;
  const remaining = totalBudget - totalSpent;
  const safeToSpend = inProgress && daysRemaining > 0 ? remaining / daysRemaining : 0;
  const pctOfBudget = totalBudget > 0 ? totalSpent / totalBudget : 0;

  const cats = CATEGORIES.map(cat => ({
    ...cat,
    spent: month.spent[cat.id] || 0,
    budget: budgets[cat.id] || 0,
    ratio: budgets[cat.id] ? (month.spent[cat.id] || 0) / budgets[cat.id] : 0,
  }));

  return {
    spent: totalSpent,
    income: month.income,
    totalBudget,
    remaining,
    pctOfBudget,
    projected,
    safeToSpend,
    daysInMonth: days,
    daysRemaining,
    inProgress,
    cats,
  };
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
