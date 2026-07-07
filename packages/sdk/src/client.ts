import type { RouteObject } from 'react-router-dom';

export interface NavSection {
  label: string;
  path: string;
  icon?: string;
}

/**
 * Card metadata for the dashboard portal launcher. Every field is optional;
 * missing values fall back to defaults derived from the module config.
 */
export interface ModulePortalMeta {
  /** Card title. Defaults to navLabel. */
  name?: string;
  /** Uppercase codename shown under the title. Defaults to the module id. */
  codename?: string;
  description?: string;
  /** Portal category id (e.g. 'finance', 'health'). Unknown values fall back to 'tools'. */
  category?: string;
  /** Lucide icon name as used by the portal icon map (e.g. 'TrendingUp'). */
  icon?: string;
  version?: string;
  clearanceLevel?: number;
}

export interface ModuleClientConfig {
  id: string;
  navLabel: string;
  basePath: string;
  routes: RouteObject[];
  nav: NavSection[];
  accent: string;
  portal?: ModulePortalMeta;
}
