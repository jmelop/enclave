import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/globals.css';
import { budgetMeta } from './meta';
import BudgetApp from '../client/BudgetApp';

export const budgetClient: ModuleClientConfig = {
  id: budgetMeta.id,
  navLabel: 'Budget',
  basePath: budgetMeta.basePath,
  routes: [
    { index: true, element: <BudgetApp /> },
    { path: '*',   element: <BudgetApp /> },
  ],
  nav: [
    { label: 'Overview',   path: '',           icon: 'layout-dashboard' },
    { label: 'Expenses',   path: 'expenses',   icon: 'receipt' },
    { label: 'Recurring',  path: 'recurring',  icon: 'calendar-days' },
    { label: 'History',    path: 'history',    icon: 'bar-chart-2' },
    { label: 'Categories', path: 'categories', icon: 'pie-chart' },
  ],
  accent: 'linear-gradient(135deg, #f59e0b, #fb923c)',
};
