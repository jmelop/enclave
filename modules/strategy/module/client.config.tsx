import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/globals.css';
import { strategyMeta } from './meta';
import StrategyApp from '../client/StrategyApp';

export const strategyClient: ModuleClientConfig = {
  id: strategyMeta.id,
  navLabel: 'Strategy',
  basePath: strategyMeta.basePath,
  routes: [
    { path: '*', element: <StrategyApp /> },
  ],
  nav: [
    { label: 'Loop',     path: '',         icon: 'refresh-ccw'     },
    { label: 'Overview', path: 'overview', icon: 'layout-dashboard' },
    { label: 'Goals',    path: 'goals',    icon: 'target'          },
    { label: 'Plans',    path: 'plans',    icon: 'check-square'    },
    { label: 'Results',  path: 'results',  icon: 'bar-chart-3'     },
    { label: 'Intel',    path: 'intel',    icon: 'flask-conical'   },
  ],
  accent: 'linear-gradient(135deg, #fbbf24, #d97706)',
  portal: {
    codename: 'COMPASS',
    description: 'Goals, plans, and results — long-term direction with review loops.',
    category: 'productivity',
    icon: 'Target',
  },
};
