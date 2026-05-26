import type { ModuleClientConfig } from '@enclave/sdk';
import { portfolioMeta } from './module.meta';
import { Overview } from './client/pages/Overview';
import { Portfolio } from './client/pages/Portfolio';

export const portfolioClient: ModuleClientConfig = {
  id: portfolioMeta.id,
  navLabel: 'Portfolio',
  basePath: portfolioMeta.basePath,
  routes: [
    { index: true, element: <Overview /> },
    { path: 'detail', element: <Portfolio /> },
  ],
};
