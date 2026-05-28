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
};
