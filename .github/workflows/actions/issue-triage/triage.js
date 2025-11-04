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

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Main triage function
 * @param {Object} params - Parameters for triage
 * @param {string} params.issueTitle - The issue title
 * @param {string} params.issueBody - The issue body/description
 * @param {string} params.issueNumber - The issue number
 * @param {string} params.apiKey - Gemini API key
 * @param {Array} params.existingLabels - Current labels on the issue
 * @returns {Promise<Object>} Triage results with labels and reasoning
 */
async function triageIssue({ issueTitle, issueBody, issueNumber, apiKey, existingLabels = [] }) {
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
    console.error('❌ Error calling Gemini API:', error.message);

    // Fallback to basic rule-based triage
    console.log('⚠️ Falling back to rule-based triage');
    return fallbackTriage(issueTitle, issueBody, existingLabels);
  }
}

/**
 * Build the prompt for Gemini to analyze the issue
 */
function buildTriagePrompt(title, body, existingLabels) {
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

Component Labels (choose ALL that apply):
- component: api - Backend API issues
- component: web - Frontend issues
- component: auth - Authentication system
- component: assessment - Assessment/exam features
- component: chat - Chat and AI features
- component: deployment - CI/CD, infrastructure
- component: database - Database-related
- component: ai - AI/Gemini integration

Priority Labels (choose ONE):
- priority: critical - System down, security vulnerability, data loss
- priority: high - Major functionality broken, blocking users
- priority: medium - Important but has workarounds
- priority: low - Nice to have, minor improvements

Size Labels (choose ONE):
- size: epic - Multi-week project (>2 weeks), needs milestone
- size: large - Multiple days (3-10 days)
- size: medium - 1-2 days
- size: small - Few hours

Status Labels (choose ALL that apply):
- needs-spec - Missing clear specification or requirements
- needs-info - Needs more information from reporter

TRIAGE RULES:
1. If the issue lacks clear acceptance criteria, add "needs-spec"
2. If the issue is vague or missing key details, add "needs-info"
3. For security issues, always set priority to critical or high
4. For "size: epic" issues, set shouldCreateMilestone to true
5. Component labels can be multiple (e.g., both api and database)
6. Be conservative with priority - most issues are medium
7. Look for keywords: "apps/api", "apps/web", "backend", "frontend", "auth", "assessment", "chat", "deployment", "CI", "database", "AI", "Gemini"

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
 * Parse Gemini's JSON response
 */
function parseGeminiResponse(text) {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '');
    }

    // Parse JSON
    const result = JSON.parse(cleanText);

    // Validate required fields
    if (!result.labels || !Array.isArray(result.labels)) {
      throw new Error('Invalid response: missing labels array');
    }

    return {
      labels: result.labels || [],
      reasoning: result.reasoning || 'No reasoning provided',
      shouldCreateMilestone: result.shouldCreateMilestone || false,
      milestoneName: result.milestoneName || null,
      confidence: result.confidence || 0.5,
      needsHumanReview: result.needsHumanReview || false
    };

  } catch (error) {
    console.error('Error parsing Gemini response:', error.message);
    console.error('Raw text:', text);
    throw new Error(`Failed to parse Gemini response: ${error.message}`);
  }
}

/**
 * Fallback rule-based triage when Gemini is unavailable
 */
function fallbackTriage(title, body, existingLabels) {
  const labels = [];
  const textToAnalyze = `${title} ${body}`.toLowerCase();

  // Type detection
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

  // Component detection
  if (textToAnalyze.includes('api') || textToAnalyze.includes('backend') || textToAnalyze.includes('apps/api')) {
    labels.push('component: api');
  }
  if (textToAnalyze.includes('web') || textToAnalyze.includes('frontend') || textToAnalyze.includes('apps/web') || textToAnalyze.includes('ui')) {
    labels.push('component: web');
  }
  if (textToAnalyze.includes('auth') || textToAnalyze.includes('login') || textToAnalyze.includes('authentication')) {
    labels.push('component: auth');
  }
  if (textToAnalyze.includes('assessment') || textToAnalyze.includes('exam') || textToAnalyze.includes('quiz')) {
    labels.push('component: assessment');
  }
  if (textToAnalyze.includes('chat') || textToAnalyze.includes('ai') || textToAnalyze.includes('gemini')) {
    labels.push('component: chat');
  }
  if (textToAnalyze.includes('deploy') || textToAnalyze.includes('ci') || textToAnalyze.includes('cd') || textToAnalyze.includes('workflow')) {
    labels.push('component: deployment');
  }
  if (textToAnalyze.includes('database') || textToAnalyze.includes('db') || textToAnalyze.includes('postgres') || textToAnalyze.includes('migration')) {
    labels.push('component: database');
  }

  // If no component detected, add needs-info
  if (!labels.some(l => l.startsWith('component:'))) {
    labels.push('needs-info');
  }

  // Spec detection
  const hasSpec = body && (
    body.includes('acceptance criteria') ||
    body.includes('requirements') ||
    body.includes('expected behavior') ||
    (body.length > 200 && (body.includes('should') || body.includes('must')))
  );

  if (!hasSpec) {
    labels.push('needs-spec');
  }

  // Priority (conservative - default to medium)
  if (textToAnalyze.includes('critical') || textToAnalyze.includes('urgent') || textToAnalyze.includes('security')) {
    labels.push('priority: high');
  } else {
    labels.push('priority: medium');
  }

  // Size estimation (conservative)
  const bodyLength = body ? body.length : 0;
  if (bodyLength > 1000 || textToAnalyze.includes('epic') || textToAnalyze.includes('large project')) {
    labels.push('size: large');
  } else if (bodyLength > 400) {
    labels.push('size: medium');
  } else {
    labels.push('size: small');
  }

  return {
    labels,
    reasoning: 'Fallback rule-based triage (Gemini API unavailable)',
    shouldCreateMilestone: false,
    confidence: 0.5,
    needsHumanReview: true
  };
}

/**
 * Format triage results as a comment
 */
function formatTriageComment(triageResult) {
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

// Export functions
module.exports = {
  triageIssue,
  formatTriageComment
};

// Allow running directly for testing
if (require.main === module) {
  const testIssue = {
    issueTitle: process.argv[2] || 'Test issue',
    issueBody: process.argv[3] || 'Test body',
    issueNumber: '123',
    apiKey: process.env.GEMINI_API_KEY,
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
