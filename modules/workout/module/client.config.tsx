import type { ModuleClientConfig } from '@enclave/sdk';
import { workoutMeta } from './meta';
import App from '../client/App';

export const workoutClient: ModuleClientConfig = {
  id: workoutMeta.id,
  navLabel: 'Workout',
  basePath: workoutMeta.basePath,
  routes: [
    { index: true, element: <App /> },
  ],
};
