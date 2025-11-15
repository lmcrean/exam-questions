#!/usr/bin/env node

import { db } from '@repo/db';
import logger from '../services/logger.js';
import { addAssessmentObjectToConversations } from '@repo/db';

const runMigration = async (): Promise<void> => {
  try {
    logger.info('Starting assessment object migration...');

    // Run the migration using the shared db instance
    await addAssessmentObjectToConversations.addAssessmentObjectToConversations(db);

    logger.info('Assessment object migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error running assessment object migration:', error as Error);
    process.exit(1);
  }
};

// Run the migration
runMigration();
