/**
 * Script to run the migration that adds the other_symptoms column to the assessments table
 */
import { addOtherSymptomsColumn } from '@repo/db';
import { db } from '@repo/db';

async function runMigration() {

  
  try {
    // Run the migration using the existing database connection
    await addOtherSymptomsColumn(db);

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runMigration(); 