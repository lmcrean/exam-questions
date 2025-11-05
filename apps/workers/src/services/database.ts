/**
 * Database Service for Workers
 *
 * Re-exports the shared @repo/db package for worker processes
 * This ensures consistent database access across all applications
 */

// Re-export everything from the shared database package
export * from '@repo/db';
export { db as default } from '@repo/db';
