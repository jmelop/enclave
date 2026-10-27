import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/globals.css';
import { inventoryMeta } from './meta';
import InventoryApp from '../client/InventoryApp';

export const inventoryClient: ModuleClientConfig = {
  id: inventoryMeta.id,
  navLabel: 'Inventory',
  basePath: inventoryMeta.basePath,
  routes: [
    { path: '*', element: <InventoryApp /> },
  ],
  nav: [
    { label: 'Inventory',  path: '',           icon: 'grid' },
    { label: 'Categories', path: 'categories', icon: 'pie-chart' },
  ],
  accent: 'linear-gradient(135deg, #6ee7b7, #059669)',
  portal: {
    codename: 'DEPOT',
    description: 'Personal inventory tracking — items, categories, and storage locations.',
    category: 'home',
    icon: 'Package',
  },
};
