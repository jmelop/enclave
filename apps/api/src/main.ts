import express from 'express';
import { Pool } from 'pg';
import { runSchemas } from './db/runSchemas';
import { createModules } from './modules';

async function connectWithRetry(pool: Pool): Promise<boolean> {
  for (let i = 0; i < 5; i++) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      console.warn(`[enclave-api] Postgres unavailable (attempt ${i + 1}/5):`, err);
      await new Promise<void>(resolve => setTimeout(resolve, 2 ** i * 1000));
    }
  }
  return false;
}

async function boot(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const connected = await connectWithRetry(pool);

  if (connected) {
    await runSchemas(pool);
  } else {
    console.warn(
      '[enclave-api] Postgres unreachable after retries — ' +
      'starting in DEGRADED mode. Endpoints with seed fallback will serve ' +
      'seed data; others may fail.'
    );
  }

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
