import type { ModuleServerConfig, DbPool } from '@enclave/sdk';
import { portfolioMeta } from './meta';
import { createPortfolioRouter } from '../server/router';

export function createPortfolioServer(pool: DbPool): ModuleServerConfig {
  return {
    id: portfolioMeta.id,
    basePath: portfolioMeta.apiBasePath,
    router: createPortfolioRouter(pool),
  };
}
