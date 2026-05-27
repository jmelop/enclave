import type { ModuleClientConfig } from './packages/sdk/src/index';
import { portfolioClient } from './modules/portfolio/module/client.config';
import { inventoryClient } from './modules/inventory/module/client.config';
import { workoutClient } from './modules/workout/module/client.config';

export const clientModules: ModuleClientConfig[] = [
  portfolioClient,
  inventoryClient,
  workoutClient,
];
