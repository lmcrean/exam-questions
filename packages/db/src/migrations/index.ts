/**
 * Database migrations
 * Export all migrations for easy access
 */

import * as initialSchema from './initialSchema.js';
import * as assessmentSchema from './assessmentSchema.js';
import * as updateAssessmentToJsonSchema from './updateAssessmentToJsonSchema.js';
import * as addAssessmentFieldsToConversations from './addAssessmentFieldsToConversations.js';
import * as addAssessmentObjectToConversations from './addAssessmentObjectToConversations.js';
import * as updateFlattenedAssessmentSchema from './updateFlattenedAssessmentSchema.js';
import * as fixChatTimestampColumns from './fixChatTimestampColumns.js';
import * as addPreviewToConversations from './20240528_add_preview_to_conversations.js';
import * as addRefreshTokens from './20250112_add_refresh_tokens.js';
import * as addOtherSymptoms from './add-other-symptoms.js';
import * as addDeletedAtToUsers from './addDeletedAtToUsers.js';

// Export as named modules to avoid conflicts
export {
  initialSchema,
  assessmentSchema,
  updateAssessmentToJsonSchema,
  addAssessmentFieldsToConversations,
  addAssessmentObjectToConversations,
  updateFlattenedAssessmentSchema,
  fixChatTimestampColumns,
  addPreviewToConversations,
  addRefreshTokens,
  addOtherSymptoms,
  addDeletedAtToUsers
};

// Re-export the main schema creation functions
export { createTables, dropTables } from './initialSchema.js';
