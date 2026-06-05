import type { Pool } from 'pg';
import { createPortfolioServer } from '../../../modules/portfolio/module/server.config';
import { createInventoryServer } from '../../../modules/inventory/module/server.config';
import { createLabServer } from '../../../modules/lab/module/server.config';

export function createModules(pool: Pool) {
  return [
    createPortfolioServer(pool),
    createInventoryServer(pool),
    createLabServer(pool),
  ];
}
