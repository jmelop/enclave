import type { ModuleServerConfig } from '@enclave/sdk';
import { portfolioMeta } from './module.meta';
import { portfolioRouter } from './server/router';

export const portfolioServer: ModuleServerConfig = {
  id: portfolioMeta.id,
  basePath: portfolioMeta.apiBasePath,
  router: portfolioRouter,
};
