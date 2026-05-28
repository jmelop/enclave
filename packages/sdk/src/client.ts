import type { RouteObject } from 'react-router-dom';

export interface NavSection {
  label: string;
  path: string;
  icon?: string;
}

export interface ModuleClientConfig {
  id: string;
  navLabel: string;
  basePath: string;
  routes: RouteObject[];
  nav: NavSection[];
  accent: string;
}
