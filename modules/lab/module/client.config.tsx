import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/globals.css';
import { labMeta } from './meta';
import LabApp from '../client/LabApp';

export const labClient: ModuleClientConfig = {
  id: labMeta.id,
  navLabel: 'Lab',
  basePath: labMeta.basePath,
  routes: [
    { index: true, element: <LabApp /> },
    { path: '*',   element: <LabApp /> },
  ],
  nav: [
    { label: 'Ideas',    path: '',         icon: 'lightbulb' },
    { label: 'Snippets', path: 'snippets', icon: 'code-2' },
    { label: 'Board',    path: 'board',    icon: 'kanban' },
    { label: 'Tags',     path: 'tags',     icon: 'tag' },
    { label: 'Archive',  path: 'archive',  icon: 'archive' },
  ],
  accent: 'linear-gradient(135deg, #fdba74, #f97316)',
  portal: {
    codename: 'SKUNKWORKS',
    description: 'Idea backlog, code snippets, kanban board, and experiment tracking.',
    category: 'development',
    icon: 'Lightbulb',
  },
};
