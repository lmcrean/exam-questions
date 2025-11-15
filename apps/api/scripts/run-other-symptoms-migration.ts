/**
 * Script to run the migration that adds the other_symptoms column to the assessments table
 */
import { addOtherSymptoms } from '@repo/db';
import { db } from '@repo/db';

async function runMigration(): Promise<void> {


  try {
    // Run the migration using the existing database connection
    await addOtherSymptoms.addOtherSymptomsColumn(db);

  } catch (error) {
    console.error('Migration failed:', error as Error);
  }
}

// Run the migration
runMigration();
