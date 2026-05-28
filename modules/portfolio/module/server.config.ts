import type { ModuleServerConfig } from '@enclave/sdk';
import { portfolioMeta } from './meta';
import { createPortfolioRouter } from '../server/router';

interface DbPool {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export function createPortfolioServer(pool: DbPool): ModuleServerConfig {
  return {
    id: portfolioMeta.id,
    basePath: portfolioMeta.apiBasePath,
    router: createPortfolioRouter(pool),
  };
}
