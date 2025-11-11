/**
 * Automated GitHub Issue Triage using Gemini AI
 *
 * This script analyzes GitHub issues and applies appropriate labels based on:
 * - Issue type (bug, feature, enhancement, etc.)
 * - Component affected (api, web, auth, etc.)
 * - Priority level
 * - Size/complexity
 * - Whether specifications are missing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface TriageParams {
  issueTitle: string;
  issueBody: string;
  issueNumber: string;
  apiKey: string;
  existingLabels?: string[];
}

interface TriageResult {
  labels: string[];
  reasoning: string;
  shouldCreateMilestone: boolean;
  milestoneName: string | null;
  confidence: number;
  needsHumanReview: boolean;
}

interface GeminiResponse {
  labels?: string[];
  reasoning?: string;
  shouldCreateMilestone?: boolean;
  milestoneName?: string | null;
  confidence?: number;
  needsHumanReview?: boolean;
}

/**
 * Main triage function
 */
export async function triageIssue({
  issueTitle,
  issueBody,
  issueNumber,
  apiKey,
  existingLabels = []
}: TriageParams): Promise<TriageResult> {
  console.log(`🔍 Triaging issue #${issueNumber}: ${issueTitle}`);

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Build the prompt for Gemini
  const prompt = buildTriagePrompt(issueTitle, issueBody, existingLabels);

  try {
    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📝 Raw Gemini response:', text);

    // Parse the JSON response
    const triageResult = parseGeminiResponse(text);

    console.log('✅ Triage completed successfully');
    return triageResult;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error calling Gemini API:', errorMessage);

    // Fallback to basic rule-based triage
    console.log('⚠️ Falling back to rule-based triage');
    return fallbackTriage(issueTitle, issueBody, existingLabels);
  }
}

/**
 * Build the prompt for Gemini to analyze the issue
 */
function buildTriagePrompt(title: string, body: string, existingLabels: string[]): string {
  return `You are an expert GitHub issue triage assistant for a full-stack TypeScript project with React frontend and Express.js backend.

PROJECT CONTEXT:
- Monorepo structure with apps/api (backend) and apps/web (frontend)
- Backend: Express.js, PostgreSQL, Google Gemini AI integration
- Frontend: React 18, Vite, Radix UI
- Key features: Authentication, Assessments/Exams, AI Chat
- CI/CD: GitHub Actions, Google Cloud Run, Firebase Hosting

ISSUE TO TRIAGE:
Title: ${title}
Body: ${body || 'No description provided'}
Existing Labels: ${existingLabels.join(', ') || 'None'}

LABEL TAXONOMY:

Type Labels (choose ONE):
- type: bug - Something isn't working correctly
- type: feature - New feature request
- type: enhancement - Improvement to existing feature
- type: refactor - Code refactoring
- type: documentation - Documentation updates
- type: security - Security-related issue
- type: performance - Performance optimization

Component Labels (ONLY assign if the issue requires code changes in that specific component):
- component: api - Issues requiring changes to apps/api backend code
- component: web - Issues requiring changes to apps/web frontend code
- component: auth - Issues requiring changes to authentication system code
- component: assessment - Issues requiring changes to assessment/exam features code
- component: chat - Issues requiring changes to chat/AI response features code
- component: database - Issues requiring database schema, migration, or query changes
- component: ai - Issues requiring changes to AI/Gemini integration code

Infrastructure Labels (for non-code issues):
- component: deployment - ONLY for CI/CD pipeline, GitHub Actions, deployment infrastructure issues that DON'T involve app code changes

Priority Labels (choose EXACTLY ONE - mutually exclusive):
- priority: critical - System down, security vulnerability, data loss
- priority: high - Major functionality broken, blocking users
- priority: medium - Important but has workarounds
- priority: low - Nice to have, minor improvements

Size Labels (choose EXACTLY ONE - mutually exclusive):
- size: epic - Multi-week project (>2 weeks), needs milestone
- size: large - Multiple days (3-10 days)
- size: medium - 1-2 days
- size: small - Few hours

Specification Quality Labels (choose EXACTLY ONE):
- needs-spec - Issue completely lacks specification, requirements, or acceptance criteria
- improve-spec - Issue has a spec but it's poorly formatted, vague, or incomplete
- spec-complete - Issue has clear, well-formatted specification with acceptance criteria

Other Status Labels (choose ALL that apply):
- needs-info - Needs more information from reporter

CRITICAL TRIAGE RULES - FOLLOW STRICTLY:

1. **Component Labels - Be Conservative:**
   - ONLY assign component labels when the issue EXPLICITLY requires code changes in that component
   - Mentioning a feature (like "chat" or "assessment") does NOT mean you should assign that component label
   - CI/CD, GitHub Actions, workflow, and infrastructure issues should ONLY get "component: deployment" if they don't involve app code
   - If an issue is purely about infrastructure (GitHub Actions, CI/CD, build process), DO NOT assign app component labels (api, web, auth, assessment, chat, database, ai)
   - When in doubt, assign NO component labels rather than guessing

2. **Priority Labels - Exactly One:**
   - You MUST choose EXACTLY ONE priority label
   - NEVER assign multiple priority labels (e.g., both medium and high)
   - Default to "priority: medium" unless there's clear evidence for higher/lower priority
   - Be conservative - most issues are medium priority

3. **Size Labels - Exactly One:**
   - You MUST choose EXACTLY ONE size label
   - NEVER assign multiple size labels

4. **Specification Quality - Exactly One:**
   - You MUST choose EXACTLY ONE spec quality label from: needs-spec, improve-spec, or spec-complete
   - needs-spec: No description, or description is just a title with no details
   - improve-spec: Has some description but lacks proper formatting, acceptance criteria, or clear requirements
   - spec-complete: Has detailed description with clear acceptance criteria, expected behavior, and requirements
   - When in doubt between improve-spec and spec-complete, choose improve-spec

5. **Information Needs:**
   - Add "needs-info" if the issue is too vague to understand or missing critical context
   - Can be combined with any spec quality label if additional clarification is needed

6. **Special Cases:**
   - Security issues: always set priority to critical or high
   - For "size: epic" issues, set shouldCreateMilestone to true
   - Infrastructure/CI issues that don't touch app code: use "component: deployment" ONLY, no other components

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):
{
  "labels": ["label1", "label2", ...],
  "reasoning": "Brief explanation of why these labels were chosen",
  "shouldCreateMilestone": false,
  "milestoneName": "Optional milestone name if shouldCreateMilestone is true",
  "confidence": 0.85,
  "needsHumanReview": false
}

Analyze the issue and provide your triage recommendation:`;
}

/**
 * Parse Gemini's JSON response and validate label rules
 */
function parseGeminiResponse(text: string): TriageResult {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '');
    }

    // Parse JSON
    const result: GeminiResponse = JSON.parse(cleanText);

    // Validate required fields
    if (!result.labels || !Array.isArray(result.labels)) {
      throw new Error('Invalid response: missing labels array');
    }

    // Validate and fix conflicting labels
    const validatedLabels = validateAndFixLabels(result.labels);

    return {
      labels: validatedLabels,
      reasoning: result.reasoning || 'No reasoning provided',
      shouldCreateMilestone: result.shouldCreateMilestone || false,
      milestoneName: result.milestoneName || null,
      confidence: result.confidence || 0.5,
      needsHumanReview: result.needsHumanReview || false
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error parsing Gemini response:', errorMessage);
    console.error('Raw text:', text);
    throw new Error(`Failed to parse Gemini response: ${errorMessage}`);
  }
}

/**
 * Validate labels and ensure only one of each mutually exclusive category
 */
function validateAndFixLabels(labels: string[]): string[] {
  const validated: string[] = [];

  // Track mutually exclusive categories
  let priorityLabel: string | null = null;
  let sizeLabel: string | null = null;
  let specLabel: string | null = null;

  for (const label of labels) {
    // Priority labels - keep only the first one (or highest priority)
    if (label.startsWith('priority:')) {
      if (!priorityLabel) {
        priorityLabel = label;
      } else {
        // If multiple priorities, keep the higher one
        const priorities = ['priority: critical', 'priority: high', 'priority: medium', 'priority: low'];
        const currentIndex = priorities.indexOf(priorityLabel);
        const newIndex = priorities.indexOf(label);
        if (newIndex < currentIndex) {
          priorityLabel = label;
        }
        console.warn(`⚠️ Multiple priority labels detected. Keeping: ${priorityLabel}`);
      }
      continue;
    }

    // Size labels - keep only the first one
    if (label.startsWith('size:')) {
      if (!sizeLabel) {
        sizeLabel = label;
      } else {
        console.warn(`⚠️ Multiple size labels detected. Keeping: ${sizeLabel}`);
      }
      continue;
    }

    // Spec quality labels - keep only the first one
    if (label === 'needs-spec' || label === 'improve-spec' || label === 'spec-complete') {
      if (!specLabel) {
        specLabel = label;
      } else {
        console.warn(`⚠️ Multiple spec quality labels detected. Keeping: ${specLabel}`);
      }
      continue;
    }

    // All other labels (type, component, etc.)
    validated.push(label);
  }

  // Add the single priority, size, and spec labels
  if (priorityLabel) validated.push(priorityLabel);
  if (sizeLabel) validated.push(sizeLabel);
  if (specLabel) validated.push(specLabel);

  return validated;
}

/**
 * Fallback rule-based triage when Gemini is unavailable
 */
function fallbackTriage(title: string, body: string, existingLabels: string[]): TriageResult {
  const labels: string[] = [];
  const textToAnalyze = `${title} ${body}`.toLowerCase();

  // Type detection (exactly one)
  if (textToAnalyze.includes('bug') || textToAnalyze.includes('error') || textToAnalyze.includes('broken')) {
    labels.push('type: bug');
  } else if (textToAnalyze.includes('feature') || textToAnalyze.includes('add ') || textToAnalyze.includes('new ')) {
    labels.push('type: feature');
  } else if (textToAnalyze.includes('refactor') || textToAnalyze.includes('cleanup')) {
    labels.push('type: refactor');
  } else if (textToAnalyze.includes('docs') || textToAnalyze.includes('documentation')) {
    labels.push('type: documentation');
  } else if (textToAnalyze.includes('improve') || textToAnalyze.includes('enhance')) {
    labels.push('type: enhancement');
  } else {
    labels.push('type: feature'); // Default
  }

  // Component detection - BE CONSERVATIVE
  // Only assign if explicitly mentions that component
  const isInfrastructure = textToAnalyze.includes('github actions') ||
                           textToAnalyze.includes('workflow') ||
                           textToAnalyze.includes('ci/cd') ||
                           (textToAnalyze.includes('ci') && textToAnalyze.includes('workflow'));

  if (isInfrastructure) {
    // Pure infrastructure issue - only deployment component
    labels.push('component: deployment');
  } else {
    // App code components - only if explicitly mentioned
    if (textToAnalyze.includes('apps/api') || (textToAnalyze.includes('api') && textToAnalyze.includes('backend'))) {
      labels.push('component: api');
    }
    if (textToAnalyze.includes('apps/web') || (textToAnalyze.includes('web') && textToAnalyze.includes('frontend'))) {
      labels.push('component: web');
    }
    if (textToAnalyze.includes('auth') && (textToAnalyze.includes('login') || textToAnalyze.includes('authentication'))) {
      labels.push('component: auth');
    }
    if (textToAnalyze.includes('assessment') && (textToAnalyze.includes('exam') || textToAnalyze.includes('quiz'))) {
      labels.push('component: assessment');
    }
    if (textToAnalyze.includes('chat') && textToAnalyze.includes('ai')) {
      labels.push('component: chat');
    }
    if (textToAnalyze.includes('database') || textToAnalyze.includes('migration') || textToAnalyze.includes('schema')) {
      labels.push('component: database');
    }
  }

  // Spec quality detection (exactly one)
  const bodyLength = body ? body.length : 0;
  const hasGoodSpec = body && (
    body.includes('acceptance criteria') ||
    body.includes('expected behavior') ||
    (body.includes('requirements') && bodyLength > 300)
  );

  const hasBasicSpec = body && bodyLength > 50;

  if (hasGoodSpec) {
    labels.push('spec-complete');
  } else if (hasBasicSpec) {
    labels.push('improve-spec');
  } else {
    labels.push('needs-spec');
  }

  // Additional status labels
  if (bodyLength < 30 || !body) {
    labels.push('needs-info');
  }

  // Priority (exactly one - conservative, default to medium)
  if (textToAnalyze.includes('critical') || textToAnalyze.includes('security vulnerability') || textToAnalyze.includes('data loss')) {
    labels.push('priority: critical');
  } else if (textToAnalyze.includes('urgent') || textToAnalyze.includes('blocking') || textToAnalyze.includes('security')) {
    labels.push('priority: high');
  } else if (textToAnalyze.includes('low priority') || textToAnalyze.includes('nice to have')) {
    labels.push('priority: low');
  } else {
    labels.push('priority: medium'); // Default
  }

  // Size estimation (exactly one - conservative)
  if (bodyLength > 1000 || textToAnalyze.includes('epic') || textToAnalyze.includes('multi-week')) {
    labels.push('size: large');
  } else if (bodyLength > 400 || textToAnalyze.includes('multiple days')) {
    labels.push('size: medium');
  } else {
    labels.push('size: small');
  }

  return {
    labels,
    reasoning: 'Fallback rule-based triage (Gemini API unavailable)',
    shouldCreateMilestone: false,
    milestoneName: null,
    confidence: 0.5,
    needsHumanReview: true
  };
}

/**
 * Format triage results as a comment
 */
export function formatTriageComment(triageResult: TriageResult): string {
  const { labels, reasoning, confidence, needsHumanReview, shouldCreateMilestone, milestoneName } = triageResult;

  let comment = `## 🤖 Automated Triage Results\n\n`;
  comment += `**Labels Applied:**\n`;
  labels.forEach(label => {
    comment += `- \`${label}\`\n`;
  });

  comment += `\n**Reasoning:** ${reasoning}\n`;

  if (shouldCreateMilestone && milestoneName) {
    comment += `\n**📍 Milestone Created:** "${milestoneName}"\n`;
  }

  if (needsHumanReview) {
    comment += `\n⚠️ **Human review recommended** - Low confidence or edge case detected.\n`;
  }

  comment += `\n*Confidence: ${(confidence * 100).toFixed(0)}%*\n`;
  comment += `\n---\n`;
  comment += `*This triage was performed automatically using Gemini AI. If you believe the labels are incorrect, please update them manually or add a comment for human review.*\n`;

  return comment;
}

// Allow running directly for testing
if (require.main === module) {
  const testIssue: TriageParams = {
    issueTitle: process.argv[2] || 'Test issue',
    issueBody: process.argv[3] || 'Test body',
    issueNumber: '123',
    apiKey: process.env.GEMINI_API_KEY || '',
    existingLabels: []
  };

  triageIssue(testIssue)
    .then(result => {
      console.log('\n📊 Triage Result:');
      console.log(JSON.stringify(result, null, 2));
      console.log('\n💬 Comment Preview:');
      console.log(formatTriageComment(result));
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
