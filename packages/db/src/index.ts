/**
 * @repo/db - Shared database package
 *
 * This package provides centralized database functionality for the Ed Tech App monorepo.
 * It includes database connection management, migrations, and common database operations.
 */

// Export database connection
export { db, dbType, default as database } from './database.js';

// Export types
export type {
  DbRecord,
  PartialDbRecord,
  WhereCondition,
  QueryOptions,
  DeleteOption,
  ConversationPreview,
  IDbService,
  OperatorValue,
  SortOrder
} from './types.js';

// Export database service (default class interface)
export { default as DbService } from './service/index.js';

// Export individual service functions
export {
  findById,
  findBy,
  findWhere,
  exists,
  create,
  update,
  delete as deleteRecord,
  getAll,
  getConversationsWithPreviews,
  createWithJson,
  findByIdWithJson,
  findByFieldWithJson,
  updateWithJson,
  updateWhere
} from './service/index.js';

// Export migrations
export * from './migrations/index.js';
