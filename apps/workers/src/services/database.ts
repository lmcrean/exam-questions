/**
 * Database Service for Workers
 *
 * Provides database access for worker processes
 * Uses the same Knex setup as the API but optimized for background jobs
 */

import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(path.dirname(__dirname));
const dbPath = path.join(rootDir, 'dev.sqlite3');

const isProduction = process.env.NODE_ENV === 'production';
const hasNeonUrl = !!process.env.NEON_DATABASE_URL;

type DbType = 'PostgreSQL (Neon)' | 'SQLite';

let db: Knex;

async function initDB(): Promise<Knex> {
  if (isProduction && hasNeonUrl) {
    console.log('🐘 Workers: Initializing Neon PostgreSQL database...');

    db = knex({
      client: 'pg',
      connection: process.env.NEON_DATABASE_URL,
      pool: {
        min: 1, // Workers use fewer connections than API
        max: 5,
      },
      acquireConnectionTimeout: 10000,
    });
  } else {
    console.log('📁 Workers: Initializing SQLite database...');

    db = knex({
      client: 'sqlite3',
      connection: {
        filename: dbPath,
      },
      useNullAsDefault: true,
      pool: {
        afterCreate: (conn: any, done: Function): void => {
          conn.run('PRAGMA foreign_keys = ON', done);
        },
      },
    });
  }
  return db;
}

const dbInstance: Knex = await initDB();
const dbType: DbType = isProduction && hasNeonUrl ? 'PostgreSQL (Neon)' : 'SQLite';

console.log(`✅ Workers database initialized: ${dbType}`);

export { dbInstance as db, dbType };
export default dbInstance;
