import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/globals.css';
import { inventoryMeta } from './meta';
import { InventoryPage } from '../client/pages/Inventory';

export const inventoryClient: ModuleClientConfig = {
  id: inventoryMeta.id,
  navLabel: 'Inventory',
  basePath: inventoryMeta.basePath,
  routes: [
    { index: true, element: <InventoryPage /> },
  ],
  nav: [
    { label: 'Inventory', path: '', icon: 'grid' },
  ],
  accent: 'linear-gradient(135deg, #10b981, #14b8a6)',
};
