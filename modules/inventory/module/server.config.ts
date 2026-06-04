import type { ModuleServerConfig, DbPool } from '@enclave/sdk'
import { inventoryMeta } from './meta'
import { createInventoryRouter } from '../server/router'

export function createInventoryServer(pool: DbPool): ModuleServerConfig {
  return {
    id: inventoryMeta.id,
    basePath: inventoryMeta.apiBasePath,
    router: createInventoryRouter(pool),
  }
}
