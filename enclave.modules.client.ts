import type { ModuleClientConfig } from './packages/sdk/src/index';
import { portfolioClient } from './modules/portfolio/module/client.config';
import { inventoryClient } from './modules/inventory/module/client.config';
import { workoutClient } from './modules/workout/module/client.config';
import { budgetClient } from './modules/budget/module/client.config';
import { labClient } from './modules/lab/module/client.config';
import { strategyClient } from './modules/strategy/module/client.config';

export const clientModules: ModuleClientConfig[] = [
  portfolioClient,
  inventoryClient,
  workoutClient,
  budgetClient,
  labClient,
  strategyClient,
];
