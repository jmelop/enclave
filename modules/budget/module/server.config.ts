import type { ModuleServerConfig, DbPool } from '@enclave/sdk'
import { budgetMeta } from './meta'
import { createBudgetRouter } from '../server/router'

export function createBudgetServer(pool: DbPool): ModuleServerConfig {
  return {
    id: budgetMeta.id,
    basePath: budgetMeta.apiBasePath,
    router: createBudgetRouter(pool),
  }
}
