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
  accent: 'linear-gradient(135deg, #6ee7b7, #059669)',
  portal: {
    codename: 'DEPOT',
    description: 'Personal inventory tracking — items, categories, and storage locations.',
    category: 'logistics',
    icon: 'Package',
  },
};
