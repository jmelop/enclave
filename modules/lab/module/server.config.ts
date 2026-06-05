import type { ModuleServerConfig, DbPool } from '@enclave/sdk'
import { labMeta } from './meta'
import { createLabRouter } from '../server/router'

export function createLabServer(pool: DbPool): ModuleServerConfig {
  return {
    id: labMeta.id,
    basePath: labMeta.apiBasePath,
    router: createLabRouter(pool),
  }
}
