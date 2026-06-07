import type { ModuleServerConfig, DbPool } from '@enclave/sdk'
import { workoutMeta } from './meta'
import { createWorkoutRouter } from '../server/router'

export function createWorkoutServer(pool: DbPool): ModuleServerConfig {
  return {
    id: workoutMeta.id,
    basePath: workoutMeta.apiBasePath,
    router: createWorkoutRouter(pool),
  }
}
