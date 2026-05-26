import type { ModuleClientConfig } from '@enclave/sdk';
import { inventoryMeta } from './meta';
import { InventoryPage } from '../client/pages/Inventory';

export const inventoryClient: ModuleClientConfig = {
  id: inventoryMeta.id,
  navLabel: 'Inventory',
  basePath: inventoryMeta.basePath,
  routes: [
    { index: true, element: <InventoryPage /> },
  ],
};
