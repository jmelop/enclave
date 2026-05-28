import type { Router } from 'express';

export interface ModuleServerConfig {
  id: string;
  basePath: string;
  router: Router;
}

export * from './domain';
