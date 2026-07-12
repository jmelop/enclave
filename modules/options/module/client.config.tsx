import type { ModuleClientConfig } from '@enclave/sdk';
import '../client/styles/globals.css';
import { optionsMeta } from './meta';
import OptionsApp from '../client/OptionsApp';

export const optionsClient: ModuleClientConfig = {
  id: optionsMeta.id,
  navLabel: 'Options',
  basePath: optionsMeta.basePath,
  routes: [
    { path: '', element: <OptionsApp /> },
  ],
  nav: [
    { label: 'General', path: '', icon: 'settings' },
  ],
  accent: 'linear-gradient(135deg, #94a3b8, #475569)',
  portal: {
    codename: 'CONTROL',
    description: 'Module visibility, appearance, and regional preferences for the enclave shell.',
    category: 'tools',
    icon: 'Settings',
  },
};
