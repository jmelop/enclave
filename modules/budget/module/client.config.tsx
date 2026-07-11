import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/globals.css';
import { budgetMeta } from './meta';
import BudgetApp from '../client/BudgetApp';

export const budgetClient: ModuleClientConfig = {
  id: budgetMeta.id,
  navLabel: 'Budget',
  basePath: budgetMeta.basePath,
  routes: [
    { path: '*', element: <BudgetApp /> },
  ],
  nav: [
    { label: 'Overview',   path: '',           icon: 'layout-dashboard' },
    { label: 'Expenses',   path: 'expenses',   icon: 'receipt' },
    { label: 'Income',     path: 'income',     icon: 'hand-coins' },
    { label: 'Recurring',  path: 'recurring',  icon: 'calendar-days' },
    { label: 'History',    path: 'history',    icon: 'bar-chart-2' },
    { label: 'Categories', path: 'categories', icon: 'pie-chart' },
  ],
  accent: 'linear-gradient(135deg, #fcd34d, #f97316)',
  portal: {
    codename: 'LEDGER',
    description: 'Expense tracking, recurring payments, monthly budgets, and spending analytics.',
    category: 'finance',
    icon: 'Receipt',
  },
};
