import type { ModuleServerConfig, DbPool } from '@enclave/sdk'
import { optionsMeta } from './meta'
import { createOptionsRouter } from '../server/router'

export function createOptionsServer(pool: DbPool): ModuleServerConfig {
  return {
    id: optionsMeta.id,
    basePath: optionsMeta.apiBasePath,
    router: createOptionsRouter(pool),
  }
}
