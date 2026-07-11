import type { Pool } from 'pg';
import { createPortfolioServer } from '../../../modules/portfolio/module/server.config';
import { createInventoryServer } from '../../../modules/inventory/module/server.config';
import { createLabServer } from '../../../modules/lab/module/server.config';
import { createBudgetServer } from '../../../modules/budget/module/server.config';
import { createStrategyServer } from '../../../modules/strategy/module/server.config';
import { createWorkoutServer } from '../../../modules/workout/module/server.config';
import { createOptionsServer } from '../../../modules/options/module/server.config';

export function createModules(pool: Pool) {
  return [
    createPortfolioServer(pool),
    createInventoryServer(pool),
    createLabServer(pool),
    createBudgetServer(pool),
    createStrategyServer(pool),
    createWorkoutServer(pool),
    createOptionsServer(pool),
  ];
}
