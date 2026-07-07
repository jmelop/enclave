import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/index.css';
import { portfolioMeta } from './meta';
import { Portfolio } from '../client/pages/Portfolio';

export const portfolioClient: ModuleClientConfig = {
  id: portfolioMeta.id,
  navLabel: 'Portfolio',
  basePath: portfolioMeta.basePath,
  routes: [
    { index: true, element: <Portfolio /> },
  ],
  nav: [
    { label: 'Portfolio', path: '', icon: 'wallet' },
  ],
  accent: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  portal: {
    name: 'Portfolio Tracker',
    codename: 'VAULTCAP',
    description: 'Strategic asset monitoring for equities, ETFs, crypto holdings, and capital allocation oversight.',
    category: 'finance',
    icon: 'TrendingUp',
    version: '1.0.0',
    clearanceLevel: 2,
  },
};
