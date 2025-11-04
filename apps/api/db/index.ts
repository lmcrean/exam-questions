/**
 * Database re-exports from @repo/db
 * This file maintains backward compatibility for any remaining local imports
 */

// Set the SQLITE_PATH environment variable for the shared package
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// Set SQLite path for the shared package to use
if (!process.env.SQLITE_PATH) {
  process.env.SQLITE_PATH = path.join(rootDir, 'dev.sqlite3');
}

// Re-export everything from the shared package
export * from '@repo/db';
export { db as default } from '@repo/db';
