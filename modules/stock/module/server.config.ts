import type { ModuleServerConfig, DbPool } from '@enclave/sdk'
import { stockMeta } from './meta'
import { createStockRouter } from '../server/router'

export function createStockServer(pool: DbPool): ModuleServerConfig {
  return {
    id: stockMeta.id,
    basePath: stockMeta.apiBasePath,
    router: createStockRouter(pool),
  }
}
