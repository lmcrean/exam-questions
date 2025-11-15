import { db } from '@repo/db';
import { createConversation, getAssessmentPattern } from '../models/chat/list/chat.js';

interface Assessment {
  id: string;
  user_id: string;
  [key: string]: unknown;
}

interface Conversation {
  id: string;
  assessment_id?: string | null;
  assessment_pattern?: string | null;
  [key: string]: unknown;
}

async function testAssessmentLinking(): Promise<void> {
  try {


    // First, let's see if there are any assessments in the database
    const assessments = await db('assessments').select<Assessment[]>('*').limit(5);


    if (assessments.length > 0) {
      const testAssessment = assessments[0];




      // Test getting assessment pattern

      const pattern = await getAssessmentPattern(testAssessment.id);


      // Test creating conversation with assessment

      const conversationId = await createConversation(
        testAssessment.user_id,
        testAssessment.id
      );



      // Verify the conversation was created with assessment data
      const createdConversation = await db('conversations')
        .where('id', conversationId)
        .first<Conversation>();






    } else {


      // Create a test conversation without assessment

      const conversationId = await createConversation('test-user-id');

    }

    // Check all conversations now

    const allConversations = await db('conversations').select<Conversation[]>('*');


    const withAssessments = allConversations.filter(conv => conv.assessment_id);


    const withPatterns = allConversations.filter(conv => conv.assessment_pattern);


    if (withPatterns.length > 0) {

      withPatterns.forEach(conv => {

      });
    }

  } catch (error) {
    console.error('Error in test:', error as Error);
  } finally {
    await db.destroy();
  }
}

testAssessmentLinking();
