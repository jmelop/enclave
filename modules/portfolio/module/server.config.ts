import type { ModuleServerConfig } from '@enclave/sdk';
import { portfolioMeta } from './meta';
import { portfolioRouter } from '../server/router';

export const portfolioServer: ModuleServerConfig = {
  id: portfolioMeta.id,
  basePath: portfolioMeta.apiBasePath,
  router: portfolioRouter,
};
