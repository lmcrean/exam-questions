import { db, addPreviewToConversations } from '@repo/db';

/**
 * Run the add preview column migration directly
 */
async function addPreviewColumn(): Promise<void> {
  try {
    console.log('Adding preview column to conversations table...');

    await addPreviewToConversations.up(db);

    console.log('Successfully added preview column to conversations table');
    process.exit(0);
  } catch (error) {
    console.error('Error adding preview column:', error);
    process.exit(1);
  }
}

// Run the migration
addPreviewColumn();
