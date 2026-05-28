import fs from 'fs';
import path from 'path';
import type { Pool } from 'pg';

export async function runSchemas(pool: Pool): Promise<void> {
  const schemaDir = path.join(process.cwd(), 'schema');

  let files: string[];
  try {
    files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.sql')).sort();
  } catch {
    console.warn('[schema] no schema/ dir found, skipping');
    return;
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(schemaDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`[schema] applied ${file}`);
    } catch (err) {
      console.error(`[schema] failed on ${file}:`, err);
      throw err;
    }
  }
}
