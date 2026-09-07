import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const migrationsDir = join(process.cwd(), 'api', 'drizzle');

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS "tadka_migrations" ("id" text PRIMARY KEY, "applied_at" timestamptz NOT NULL DEFAULT now())`);
  const files = (await readdir(migrationsDir)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  for (const file of files) {
    const [existing] = (await pool.query('SELECT 1 FROM tadka_migrations WHERE id = $1', [file])).rows;
    if (existing) continue;
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO tadka_migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  console.log('Database migrations are up to date.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
