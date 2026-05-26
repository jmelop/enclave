import type { RouteObject } from 'react-router-dom';

export interface ModuleClientConfig {
  id: string;
  navLabel: string;
  basePath: string;
  routes: RouteObject[];
}
