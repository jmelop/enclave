import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/globals.css';
import { stockMeta } from './meta';
import StockApp from '../client/StockApp';

export const stockClient: ModuleClientConfig = {
  id: stockMeta.id,
  navLabel: 'Stock',
  basePath: stockMeta.basePath,
  routes: [
    { path: '*', element: <StockApp /> },
  ],
  nav: [
    { label: 'Stock', path: '', icon: 'shopping-bag' },
  ],
  accent: 'linear-gradient(135deg, #fde68a, #d97706)',
  portal: {
    codename: 'MARKET',
    description: 'Products for sale — units on hand, unit economics and sales per platform.',
    category: 'finance',
    icon: 'ShoppingBag',
  },
};
