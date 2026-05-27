import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/index.css';
import { portfolioMeta } from './meta';
import { AppShell } from '../client/components/layout/AppShell';
import { Portfolio } from '../client/pages/Portfolio';

export const portfolioClient: ModuleClientConfig = {
  id: portfolioMeta.id,
  navLabel: 'Portfolio',
  basePath: portfolioMeta.basePath,
  routes: [
    { index: true, element: <div className="v-shell"><AppShell><Portfolio /></AppShell></div> },
  ],
};
