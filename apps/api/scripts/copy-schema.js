const fs = require('fs');
const path = require('path');

// tsc mirrors apps/api/src into dist/apps/api/src but does not copy non-TS
// assets. Mirroring schema/ at the same relative nesting (dist/apps/api/schema)
// keeps runSchemas.ts's __dirname-relative lookup correct in both dev (tsx
// running from src/) and compiled (node running from dist/) layouts.
fs.cpSync(
  path.join(__dirname, '../schema'),
  path.join(__dirname, '../dist/apps/api/schema'),
  { recursive: true }
);
