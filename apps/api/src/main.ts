import express from 'express';
import { Pool } from 'pg';
import { runSchemas } from './db/runSchemas';
import { createModules } from './modules';

async function boot(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await runSchemas(pool);

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  for (const mod of createModules(pool)) {
    app.use(mod.basePath, mod.router);
    console.log(`[enclave-api] mounted ${mod.id} at ${mod.basePath}`);
  }

  const PORT = process.env.PORT ?? 4000;
  app.listen(PORT, () => console.log(`[enclave-api] listening on :${PORT}`));
}

boot().catch(err => {
  console.error('[enclave-api] fatal:', err);
  process.exit(1);
});
