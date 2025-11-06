import ParseAssessmentJson from './ParseAssessmentJson.js';
import type { AssessmentApiInput, AssessmentDbPayload } from '../types.js';

class TransformApiToDb {
  /**
   * Transform assessment data for database storage
   * Handles both camelCase and snake_case input formats
   * @param assessmentData - Assessment data from API
   * @returns Database payload
   */
  static transform(assessmentData: AssessmentApiInput): AssessmentDbPayload {
    // Handle both camelCase and snake_case formats
    const data = assessmentData as any;

    // Extract fields, supporting both naming conventions
    // Use ?? (nullish coalescing) to preserve falsy values like 0
    const age = data.age;
    const pattern = data.pattern;
    const cycle_length = data.cycle_length ?? data.cycleLength;
    const period_duration = data.period_duration ?? data.periodDuration;
    const flow_heaviness = data.flow_heaviness ?? data.flowHeaviness;
    const pain_level = data.pain_level ?? data.painLevel;

    // Handle nested symptoms structure (symptoms.physical/emotional) or flat structure (physical_symptoms/emotional_symptoms)
    let physical_symptoms = data.physical_symptoms;
    let emotional_symptoms = data.emotional_symptoms;
    let other_symptoms = data.other_symptoms;

    // Check if symptoms are nested under a 'symptoms' object
    if (data.symptoms && typeof data.symptoms === 'object') {
      physical_symptoms = physical_symptoms ?? data.symptoms.physical;
      emotional_symptoms = emotional_symptoms ?? data.symptoms.emotional;
      other_symptoms = other_symptoms ?? data.symptoms.other;
    }

    const recommendations = data.recommendations;

    return {
      age,
      pattern,
      cycle_length,
      period_duration,
      flow_heaviness,
      pain_level,
      other_symptoms: ParseAssessmentJson.serializeOtherSymptoms(other_symptoms),
      physical_symptoms: ParseAssessmentJson.serializeArrayField(physical_symptoms),
      emotional_symptoms: ParseAssessmentJson.serializeArrayField(emotional_symptoms),
      recommendations: ParseAssessmentJson.serializeArrayField(recommendations)
    };
  }
}

export default TransformApiToDb;
