import type { ModuleServerConfig, DbPool } from '@enclave/sdk'
import { strategyMeta } from './meta'
import { createStrategyRouter } from '../server/router'

export function createStrategyServer(pool: DbPool): ModuleServerConfig {
  return {
    id: strategyMeta.id,
    basePath: strategyMeta.apiBasePath,
    router: createStrategyRouter(pool),
  }
}
