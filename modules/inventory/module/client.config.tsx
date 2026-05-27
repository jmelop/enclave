import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/globals.css';
import { inventoryMeta } from './meta';
import { AppShell } from '../client/components/layout/AppShell';
import { InventoryPage } from '../client/pages/Inventory';

export const inventoryClient: ModuleClientConfig = {
  id: inventoryMeta.id,
  navLabel: 'Inventory',
  basePath: inventoryMeta.basePath,
  routes: [
    { index: true, element: <AppShell><InventoryPage /></AppShell> },
  ],
};
