import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/tokens.css';
import { workoutMeta } from './meta';
import App from '../client/App';

export const workoutClient: ModuleClientConfig = {
  id: workoutMeta.id,
  navLabel: 'Workout',
  basePath: workoutMeta.basePath,
  routes: [
    { path: '*', element: <App /> },
  ],
  nav: [
    { label: 'Overview',  path: '',         icon: 'layout-dashboard' },
    { label: 'Workouts',  path: 'workouts', icon: 'dumbbell' },
    { label: 'Body',      path: 'body',     icon: 'activity' },
  ],
  accent: 'linear-gradient(135deg, #a855f7, #6366f1)',
  portal: {
    codename: 'FORGE',
    description: 'Training log — routines, sessions, body metrics, and progression tracking.',
    category: 'health',
    icon: 'Dumbbell',
  },
};
