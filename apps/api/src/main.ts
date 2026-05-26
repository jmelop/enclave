import express from 'express';
import { serverModules } from './modules';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

for (const mod of serverModules) {
  app.use(mod.basePath, mod.router);
  console.log(`[enclave-api] mounted ${mod.id} at ${mod.basePath}`);
}

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`[enclave-api] listening on :${PORT}`));
