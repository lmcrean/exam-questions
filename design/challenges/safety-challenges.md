# Safety Challenges & Mitigation Strategies

Much of the safety challenges focuses on protecting users aged 11-18 (KS3-KS4 in UK schools).

**Legal Disclaimer: all statements below are hypothetical scenarios performed for product research, they do not reflect the actions of any individual or institution.**

## Core Safety Challenges of an Ed Tech app

1. **Student uploads inappropriate/illegal photo**
2. **Student shares sensitive/inappropriate/malicious information in text**
3. **Bad actor accesses student information**

---

# Challenge 1: Inappropriate/Illegal Photo Uploads

## Threat Overview

**Risk:** Students may upload images containing:
- Explicit/sexual content
- Violence or graphic imagery
- Illegal content (CSAM, extremist material)
- Personal identifying information (IDs, addresses)
- Bullying/harassment content targeting others

**Impact:** Legal liability, safeguarding failures, platform misuse, reputational damage

**Affected Users:** Students aged 11-18, teachers, school administration

---

## Mitigation Strategies

### 1. Defer Image Uploads to Post-MVP (Recommended for MVP)

**What:** Don't support image uploads in MVP; accept only text, PDF, and DOCX formats

**Important:** DOCX files are converted to PDF server-side before AI processing (Gemini API only supports PDF/plain text)
- Conversion handled by `apps/docx-to-pdf` microservice
- User experience: upload DOCX → server converts → AI processes as PDF

**Why:**
- Simplifies safety requirements (text-based PDFs have lower risk)
- Reduces technical complexity and cost
- Allows focus on core AI marking functionality
- Can be added in Iteration 1 after validating core product

**When:** MVP (already supported in technical-challenges.md)

**Cost:** $0 (reduction in scope)

**Trade-off:** Students with handwritten work must type or convert to text-based PDF

**Implementation:** Validate file types on both frontend and backend to ensure only PDF, DOCX, and plain text files are accepted. Reject image uploads with clear error messaging.

**Decision:** ✅ Implement for MVP - defer images until safety mechanisms proven

**Why this is the best approach:**
- PDF and DOCX files contain structured text that's easier to moderate
- Text extraction from PDFs/DOCX is reliable and doesn't expose student data to third parties
- Teacher can review text content for inappropriate material
- Avoids privacy concerns of sending student work to external image moderation APIs
- Significantly simpler to implement and maintain

---

### 2. Teacher Review Queue for Flagged Content

**What:** Flagged content (from text scanning, PII detection, crisis keywords) goes to teacher for manual review

**Implementation:**
- Store flagged submissions in database with pseudonym, flag reason, and status
- Notify teacher when content requires review
- Teacher dashboard displays pending items with options to:
  - Approve submission
  - Reject and delete
  - Report to Designated Safeguarding Lead (DSL)

**When:** MVP (for text flagging)

**Cost:** $0 (built into platform)

**Trade-off:** Teacher workload increased for flagged items (acceptable - safeguarding is their responsibility)

### 3. File Size and Type Restrictions

**What:** Limit what students can upload to reduce attack surface

**Implementation:**
- Maximum file size: 10 MB
- Allowed file types: PDF, DOCX, plain text only
- Frontend validation: Check file extension and MIME type before upload
- Backend validation: Re-validate server-side (never trust client), check actual file content using magic bytes to prevent spoofing
- DOCX conversion: After validation, DOCX files are converted to PDF via `apps/docx-to-pdf` microservice before AI processing
- Reject invalid files with clear error messages

**Why:**
- Prevents malware uploads disguised as documents
- Reduces server storage costs
- Limits attack vectors (e.g., zip bombs, executable files)

**When:** MVP

**Cost:** $0

---

### 4. Virus/Malware Scanning

**What:** Scan uploaded files for malware before processing

**Options:**

#### Option A: ClamAV (Open Source) - Recommended for MVP
- Free (self-hosted) or ~$20/month (managed service)
- Sufficient for 330 students
- Open-source antivirus engine

#### Option B: VirusTotal API
- Free tier (4 requests/minute) or $500+/year (commercial)
- Consider for Iteration 1 if higher volume needed

**Recommended Approach:** Use ClamAV for MVP

**Implementation Flow:**
1. Student uploads file → Store in temporary location
2. Scan with antivirus engine
3. If virus detected → Delete file, show error message
4. If clean → Proceed with content extraction
5. Log all virus detections for security monitoring

**When:** MVP

---

## Summary: File Upload Mitigation Roadmap

### MVP (Month 1-3)
- ✅ **No images** - Accept only PDF/DOCX/text
- ✅ **File type validation** - Block all image uploads with clear messaging
- ✅ **DOCX-to-PDF conversion** - Convert DOCX to PDF server-side via `apps/docx-to-pdf` (Gemini API requirement)
- ✅ **File size limits** - 10 MB maximum
- ✅ **Malware scanning** - ClamAV on all uploads
- ✅ **Teacher moderation queue** - For flagged text content
- ✅ **Text extraction** - PDF parsed locally (no third-party APIs)

**Cost:** $0-20/month (ClamAV hosting)

**Why this works:** Text-based files (PDF/DOCX) are easier to moderate than images, and text extraction doesn't require sharing student work with third parties. DOCX files are converted to PDF before AI processing since Gemini API only supports PDF and plain text formats.

### Future Considerations (Post-MVP)
If image support is required in future iterations:
- Consider teacher-only manual review (maintains zero-knowledge architecture)
- Evaluate self-hosted ML models (avoids third-party data sharing)
- Any solution must preserve privacy-first approach (no student data to external APIs)

---

# Challenge 2: Inappropriate/Malicious Text Content

## Threat Overview

**Risk:** Students may submit text containing:
- Profanity, hate speech, slurs
- Personal identifying information (PII) - names, addresses, phone numbers
- Self-harm or suicidal ideation
- Bullying or threats targeting others
- Malicious code (XSS attempts, SQL injection)
- Spam or irrelevant content

**Impact:** Safeguarding failures, data leaks, security vulnerabilities, platform misuse

---

## Mitigation Strategies

### 1. Profanity Filtering

**What:** Detect and flag inappropriate language in student submissions

**Option A: Client-Side Warning (Recommended for MVP)**
- Use profanity detection library on client-side
- Show warning to student if inappropriate language detected
- Still allow submission (educational context - students may be writing about mature topics)
- Student sees message: "Your submission contains language that may be inappropriate. Please review before submitting."

**Why client-side only for MVP:**
- Educational context: Students writing about mature topics (Shakespeare, WWII) may use contextually appropriate language
- Teacher judgment: Better to flag for teacher review than auto-reject legitimate work
- False positives: Some words trigger filters incorrectly (Scunthorpe problem)

**When:** MVP

**Cost:** Free

---

**Option B: Server-Side Flagging (Iteration 1)**
- Check content for profanity on server-side
- Don't auto-reject - flag for teacher review
- Return flagged status with reason for teacher dashboard

**When:** Iteration 1

**Cost:** Free

**Trade-off:** Risk of false positives in educational content (e.g., historical quotes, literature analysis)

**Recommendation:** Flag for teacher review, don't auto-reject

---

### 2. Personal Identifying Information (PII) Detection

**What:** Prevent students from accidentally sharing sensitive personal information

**Implementation:**
Use regex patterns to detect:
- UK phone numbers (07... or +44...)
- UK postcodes
- Email addresses
- National Insurance numbers

**User Experience:**
- Run PII detection before submission
- If detected, show warning modal to student
- List types of personal information found
- Message: "Please remove any phone numbers, addresses, or identifying details before submitting"
- Provide options: "Review Submission" or "Submit Anyway"
- Don't block submission (student may have legitimate reason)

**Why this matters:**
- Students aged 11-14 may not understand privacy risks
- Prevents accidental doxxing of themselves or family members
- Complies with UK GDPR data minimization principles

**When:** MVP (essential for child protection)

**Cost:** $0 (regex-based detection)

**Trade-off:** False positives (e.g., fictional phone numbers in creative writing)

**Mitigation:** Warn but don't block; let student decide

---

### 3. Self-Harm and Crisis Keyword Detection

**What:** Detect indicators of self-harm, suicide ideation, or severe distress

**Implementation:**
- Maintain list of crisis keywords (e.g., "kill myself", "want to die", "suicide", "self harm", etc.)
- Check submission text for these keywords
- If detected:
  - Flag immediately in database as CRITICAL priority
  - Send urgent notification to teacher (with sound alert)
  - Mark as "requires immediate action"
  - DO NOT auto-reject submission

**Notification Flow:**
- Teacher sees: "URGENT: Submission from [pseudonym] contains concerning content. Immediate review required."
- Flagged item appears at top of moderation queue
- Teacher can then take appropriate safeguarding action

**Critical:**
- Do NOT auto-reject (student needs help, blocking submission may escalate crisis)
- Do NOT send content to external API (privacy + sensitivity)
- DO alert teacher immediately (safeguarding duty)
- DO process submission (grading continues, but teacher informed)

**When:** MVP (safeguarding essential)

**Cost:** $0

**Legal Context:**
- UK schools have duty of care under "Keeping Children Safe in Education 2024"
- Teachers are mandatory reporters for child protection concerns
- Platform must facilitate (not obstruct) safeguarding processes

---

### 4. Malicious Input Detection (XSS, Injection Attacks)

**What:** Prevent malicious code injection that could compromise security

**Implementation:**
- Sanitize all user input before storing
- Remove HTML tags (students shouldn't be submitting HTML)
- Escape special characters
- Check for suspicious patterns:
  - Script tags
  - JavaScript protocols
  - Event handlers (onclick, etc.)
  - HTML comments
  - SQL injection attempts (UNION SELECT, etc.)
- If malicious input detected:
  - Log security event
  - Store sanitized version
  - Show warning to student

**Database Security:**
- ALWAYS use parameterized queries (Knex.js handles automatically)
- NEVER use string concatenation for SQL queries

**Why this matters:**
- Prevents XSS attacks on teacher dashboard
- Prevents SQL injection attacks on database
- Protects platform integrity
- Common attack vector for 14-18 year olds learning programming

**When:** MVP (security essential)

**Cost:** $0

**Trade-off:** Legitimate code samples (e.g., computer science assignment) may be flagged
- Mitigation: Provide "code block" input option in future iterations

---

### 5. Rate Limiting and Spam Prevention

**What:** Prevent abuse through excessive submissions or spam

**Implementation:**
- API rate limiter: Maximum 10 submissions per 15 minutes per student
- Per-student per-assignment limits: Maximum 5 submissions per 24 hours
- Error message: "Too many submissions. Please wait before trying again."
- Check limits before processing submission

**Why:**
- Prevents denial-of-service attacks
- Prevents students from spamming teacher with multiple versions
- Reduces server costs (AI marking is paid per submission)

**When:** MVP

**Cost:** $0

**Trade-off:** Legitimate resubmissions may be blocked
- Mitigation: Teacher can manually allow resubmissions via dashboard

---

### 6. Content Length Validation

**What:** Enforce reasonable length limits

**Implementation:**
- Maximum message length: 4000 characters
- Minimum message length: 1 character (not empty)
- Validate on both client and server-side
- Show clear error messages if limits exceeded

**Why:**
- Prevents buffer overflow attacks
- Reduces AI API costs (Claude charges per token)
- Forces students to be concise (educational benefit)

**When:** MVP

**Cost:** $0

---

## Summary: Text Content Mitigation Roadmap

### MVP (Month 1-3)
- ✅ **Input sanitization** - Remove HTML, escape special characters
- ✅ **PII detection** - Warn students about personal information
- ✅ **Crisis keyword detection** - Alert teacher immediately
- ✅ **Rate limiting** - Prevent spam/abuse
- ✅ **Length validation** - Already implemented
- ✅ **Parameterized queries** - SQL injection prevention (Knex.js)

**Cost:** $0

### Iteration 1 (Month 4-6)
- ✅ **Profanity flagging** - Server-side detection + teacher review
- ✅ **Advanced PII detection** - Machine learning-based (spaCy NER)
- ✅ **Sentiment analysis** - Detect bullying/harassment patterns
- ✅ **Audit logging** - Track all flagged content

**Cost:** $0-20/month (if using ML models)

---

# Challenge 3: Bad Actor Accessing Student Information

## Threat Overview

**Risk:** Unauthorized access to student data through:
- Weak authentication (credential stuffing, brute force)
- Session hijacking (XSS, CSRF attacks)
- Direct object reference (accessing other students' work)
- Man-in-the-middle attacks (unencrypted traffic)
- Database breaches (SQL injection, unencrypted data)
- Social engineering (phishing teachers)
- Insider threats (compromised teacher accounts)
- Physical device theft (teacher's laptop with local roster)

**Impact:** Student privacy breach, GDPR violations, safeguarding failures, reputational damage, legal liability

**Severity:** CRITICAL (children's data, GDPR fines up to 4% of revenue or £17.5M)

---

## Mitigation Strategies

### 1. Zero-Knowledge Architecture (Primary Defense)

**What:** Server never stores student names - uses pseudonyms + E2E encryption

**Architecture Overview:**
- Server stores: pseudonyms + encrypted content
- Teacher's browser stores: pseudonym-to-name mapping + decryption keys
- Server never knows student identities

**Why this is the strongest mitigation:**
- Even if bad actor breaches server, they get: pseudonyms + encrypted blobs
- Cannot identify students without teacher's browser data
- Cannot read submission content without encryption keys
- Maintains pseudonymous architecture from legal-challenges.md

**When:** MVP (core architecture decision)

**Cost:** $0 (design decision, not additional feature)

**Trade-off:** Teacher loses browser data → roster lost (acceptable for MVP)

**Mitigation for trade-off:** Encrypted cloud backup (Iteration 1)

---

### 2. Strong Authentication & Authorization

#### A) Teacher Authentication

**Implementation:**
- JWT-based authentication
- Strong password requirements:
  - Minimum 12 characters
  - Uppercase, lowercase, number, special character required
- bcrypt password hashing (saltRounds: 12)
- Authentication flow:
  - Verify email/password
  - Use constant-time responses (prevent timing attacks)
  - Log failed login attempts
  - Generate JWT token (24-hour expiration)
- Token verification middleware on all protected endpoints

**When:** MVP

**Cost:** $0

---

#### B) Two-Factor Authentication (2FA) - Iteration 1

**Implementation:**
- Use TOTP (Time-based One-Time Password) library
- Enable 2FA flow:
  - Generate secret key for teacher
  - Generate QR code for Google Authenticator/Authy
  - Store encrypted secret in database
- Login with 2FA:
  - Verify email/password first
  - Then verify 6-digit TOTP code
  - Allow 60 seconds time drift for clock differences

**When:** Iteration 1 (high-value feature for security-conscious schools)

**Cost:** $0

**Trade-off:** Adds friction to login process
- Mitigation: Make optional, strongly recommend for teachers

---

#### C) Student Submission Authentication (Secure Links)

**Problem:** Students access submission page via link - how to prevent unauthorized access?

**Solution:** Time-limited, single-use submission tokens

**Implementation:**
- Generate cryptographically secure random token (32 bytes)
- Store in database with:
  - Assignment ID
  - Student pseudonym
  - Expiration date (7 days)
  - Used flag (boolean)
- Validation flow:
  - Check token exists, not used, not expired
  - Mark as used after first submission
  - Verify pseudonym matches token
- Error message: "Invalid or expired submission link. Contact your teacher."

**Why:**
- Prevents students from accessing each other's submission links
- Time-limited (expires after 7 days)
- Single-use (can't resubmit without teacher approval)
- No authentication required (reduces friction for students)

**When:** MVP

**Cost:** $0

---

### 3. Access Control & Authorization

**What:** Ensure users can only access data they're authorized to see

**Implementation:**
- Authorization middleware for all protected endpoints
- Teacher authorization:
  - Verify teacher owns the assignment before allowing access
  - Filter database queries by teacher_id
  - Return 403 error if unauthorized
- Student authorization:
  - Validate submission token matches student pseudonym
  - Prevent cross-student data access
  - Check token validity (not expired, not used)

**Example Authorization Flow:**
- Endpoint: GET /api/assignments/:id/submissions
- Required: JWT authentication (must be logged in)
- Authorization check: Verify teacher_id matches assignment owner
- Data filtering: Only return submissions for this assignment

**Principles:**
- Teachers can only access assignments they created
- Students can only submit to their own pseudonym link
- No cross-user data access
- Database queries filtered by user_id/pseudonym

**When:** MVP

**Cost:** $0

---

### 4. HTTPS Everywhere + Secure Headers

**What:** Encrypt all traffic and protect against common web vulnerabilities

**Implementation:**
- Use Helmet.js for secure HTTP headers
- Content Security Policy (CSP):
  - Restrict script/style sources to self
  - Minimize use of unsafe-inline
  - Block object/embed tags
  - Upgrade insecure requests automatically
- HSTS (HTTP Strict Transport Security):
  - Max age: 1 year
  - Include subdomains
  - Preload eligible
- Additional security headers:
  - X-Frame-Options: DENY (prevent clickjacking)
  - X-Content-Type-Options: nosniff (prevent MIME sniffing)
  - X-XSS-Protection: enabled
  - Referrer-Policy: strict-origin-when-cross-origin
- CORS configuration:
  - Only allow your frontend domain
  - Enable credentials
  - Restrict HTTP methods
- Force HTTPS redirect in production

**When:** MVP (deploy with HTTPS from day 1)

**Cost:** $0 (Let's Encrypt free SSL)

---

### 5. Database Security

**A) Encryption at Rest**

**Implementation:**
- GCP Cloud SQL: Automatically encrypted with Google-managed keys
- Application-level encryption for sensitive content:
  - Algorithm: AES-256-GCM
  - Generate random IV (16 bytes) for each encryption
  - Use authentication tags for integrity verification
  - Store as: `iv:authTag:encryptedContent`
- Encryption key stored securely in environment variables
- All submission content encrypted before storing

**Why:**
- Protects data if database backup stolen
- Complies with GDPR "encryption at rest" requirement
- Defense in depth (even if server breached, data encrypted)

**When:** MVP

**Cost:** $0 (built into Cloud SQL + Node.js crypto)

---

**B) SQL Injection Prevention**

**Implementation:**
- ALWAYS use parameterized queries (Knex.js handles automatically)
- NEVER use string concatenation in SQL queries
- If raw queries needed, use parameter binding

**Best Practices:**
- ✅ SAFE: `database('users').where('email', userInput)`
- ❌ UNSAFE: `database.raw("SELECT * FROM users WHERE email = '" + userInput + "'")`
- ✅ SAFE (raw): `database.raw('SELECT * FROM users WHERE email = ?', [userInput])`

**When:** MVP (already implemented)

**Cost:** $0

---

**C) Database Access Restrictions**

**Implementation:**
- Database firewall rules:
  - Allow: Backend server IP only
  - Allow: Admin VPN IP for management
  - Deny: All other connections
- User permissions:
  - API user: SELECT, INSERT, UPDATE only (no DELETE/DROP)
  - API user: Access to app tables only (not system tables)
  - Admin user: Full permissions, requires VPN + IP whitelist

**When:** MVP (deploy with restricted access from day 1)

**Cost:** $0 (configuration)

---

### 6. Audit Logging & Monitoring

**What:** Track all security-relevant events for forensics and detection

**Implementation:**
```javascript
// Security event logger
async function logSecurityEvent(event) {
  await database('security_logs').insert({
    event_type: event.type,
    user_id: event.user_id || null,
    ip_address: event.ip || null,
    user_agent: event.userAgent || null,
    details: JSON.stringify(event.details),
    severity: event.severity || 'INFO',
    timestamp: new Date()
  });

  // Alert on critical events
  if (event.severity === 'CRITICAL') {
    await sendAlertToAdmin(event);
  }
}

// Events to log:
// - Failed login attempts
// - Successful logins
// - Password changes
// - Assignment access
// - Submission uploads
// - Flagged content
// - API rate limit violations
// - Database errors
// - Encryption failures

// Example: Log assignment access
app.get('/api/assignments/:id', authenticateToken, async (req, res) => {
  await logSecurityEvent({
    type: 'assignment_accessed',
    user_id: req.user.user_id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details: { assignment_id: req.params.id },
    severity: 'INFO'
  });

  // Process request
});

// Monitoring dashboard (for you)
async function getSecurityAlerts() {
  // Failed logins from same IP (brute force attempt)
  const suspiciousLogins = await database('security_logs')
    .where('event_type', 'failed_login')
    .where('timestamp', '>', new Date(Date.now() - 60 * 60 * 1000))  // Last hour
    .groupBy('ip_address')
    .having(database.raw('COUNT(*) > 5'));

  // Multiple users from same IP (credential stuffing)
  const credentialStuffing = await database('security_logs')
    .where('event_type', 'failed_login')
    .where('timestamp', '>', new Date(Date.now() - 60 * 60 * 1000))
    .groupBy('ip_address')
    .having(database.raw('COUNT(DISTINCT user_id) > 3'));

  return { suspiciousLogins, credentialStuffing };
}
```

**When:** MVP

**Cost:** $0 (database storage)

**Retention:** 90 days (balance between forensics and storage costs)

---

### 7. Session Management & CSRF Protection

**What:** Prevent session hijacking and cross-site request forgery

**Implementation:**
```javascript
import csrf from 'csurf';
import session from 'express-session';

// CSRF protection
const csrfProtection = csrf({ cookie: true });

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,  // Cannot be accessed by JavaScript
    secure: true,    // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));

// Apply CSRF protection to state-changing endpoints
app.post('/api/submit', csrfProtection, authenticateToken, async (req, res) => {
  // Validate CSRF token (automatically checked by middleware)
  // Process submission
});

// Frontend: Include CSRF token in forms
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

**When:** MVP

**Cost:** $0

---

### 8. Physical Security (Teacher's Device)

**Problem:** If teacher's laptop stolen, attacker has:
- LocalStorage with roster mapping (pseudonym → student name)
- Encryption keys for content
- Session tokens for platform access

**Mitigations:**

#### A) Auto-logout on Inactivity
```javascript
// Frontend: Auto-logout after 30 minutes inactivity
let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    // Logout user
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login?reason=inactivity';
  }, 30 * 60 * 1000);  // 30 minutes
}

// Reset on user activity
document.addEventListener('mousedown', resetInactivityTimer);
document.addEventListener('keydown', resetInactivityTimer);
```

**When:** MVP

**Cost:** $0

---

#### B) Encrypted LocalStorage (Iteration 1)
```javascript
import CryptoJS from 'crypto-js';

// Encrypt roster in LocalStorage with teacher's password
function saveRosterSecurely(roster, teacherPassword) {
  const encryptedRoster = CryptoJS.AES.encrypt(
    JSON.stringify(roster),
    teacherPassword
  ).toString();

  localStorage.setItem('encrypted_roster', encryptedRoster);
}

function loadRosterSecurely(teacherPassword) {
  const encryptedRoster = localStorage.getItem('encrypted_roster');

  if (!encryptedRoster) return null;

  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedRoster, teacherPassword);
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    throw new Error('Incorrect password');
  }
}
```

**Why:**
- If laptop stolen, attacker cannot read roster without teacher's password
- Adds layer of defense against physical device theft

**When:** Iteration 1

**Cost:** $0

**Trade-off:** Teacher must enter password each session

---

### 9. Third-Party Service Security

**Problem:** You send data to external services (Claude API for grading)

**Mitigations:**

#### A) Minimize Data Sent to AI APIs
```javascript
// Before sending to Claude API
function prepareSubmissionForAI(submission) {
  // Remove any metadata that could identify student
  return {
    content: submission.content,  // Just the essay text
    rubric: assignment.rubric  // Just the marking criteria
    // DO NOT send: student name, email, pseudonym, school name
  };
}

// Claude API call
async function markWithAI(content, rubric) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Grade the following submission based on this rubric...\n\nRubric: ${rubric}\n\nSubmission: ${content}`
      // No student identifying information included
    }]
  });

  return response.content[0].text;
}
```

**Why:**
- Reduces privacy risk (Anthropic doesn't see student names)
- Complies with GDPR data minimization
- Maintains pseudonymous architecture

**When:** MVP

**Cost:** $0

---

#### B) Review Third-Party Privacy Policies
- **Anthropic Claude:** Does not train on API data (confirmed in terms)
- **Hosting (GCP Cloud Run):** GDPR-compliant, EU data residency available

**When:** MVP (due diligence before launch)

**Cost:** $0 (research time)

---

### 10. Incident Response Plan

**What:** Procedure to follow if security breach occurs

**Plan:**
```markdown
# Security Incident Response Plan

## Phase 1: Detection & Triage (Within 1 hour)
1. Identify nature of breach (database, API, account compromise)
2. Assess scope (how many users affected?)
3. Contain breach (revoke tokens, block IPs, take system offline if necessary)

## Phase 2: Investigation (Within 24 hours)
1. Review security logs
2. Identify entry point and vulnerability exploited
3. Determine what data was accessed/stolen
4. Document timeline of events

## Phase 3: Notification (Within 72 hours - GDPR requirement)
1. Notify ICO (UK data protection authority) if personal data breached
2. Notify affected schools/teachers
3. Notify affected students/parents (if identifiable data breached)
4. Prepare public statement (if required)

## Phase 4: Remediation (Within 1 week)
1. Patch vulnerability
2. Reset all passwords/tokens
3. Implement additional security measures
4. Security audit of entire system

## Phase 5: Post-Incident Review (Within 2 weeks)
1. Root cause analysis
2. Update security procedures
3. Train team on lessons learned
4. Document incident for compliance
```

**When:** MVP (have plan ready before launch)

**Cost:** $0 (planning)

---

## Summary: Bad Actor Access Prevention Roadmap

### MVP (Month 1-3) - Essential Protections
- ✅ **Zero-knowledge architecture** - Pseudonyms + E2E encryption (no student names on server)
- ✅ **Strong authentication** - JWT + bcrypt + password requirements
- ✅ **Authorization** - Access control on all endpoints
- ✅ **HTTPS everywhere** - SSL/TLS encryption in transit
- ✅ **Secure headers** - Helmet.js (CSP, HSTS, XSS protection)
- ✅ **Database encryption** - Encryption at rest + parameterized queries
- ✅ **Audit logging** - Track all security events
- ✅ **CSRF protection** - Prevent cross-site attacks
- ✅ **Rate limiting** - Prevent brute force attacks
- ✅ **Secure submission tokens** - Time-limited, single-use links
- ✅ **Auto-logout** - 30 minutes inactivity
- ✅ **Incident response plan** - Ready to execute if breach occurs

**Cost:** $0-50/month (SSL cert + monitoring)

**Result:** Industry-standard security posture suitable for handling children's data

---

### Iteration 1 (Month 4-6) - Enhanced Security
- ✅ **Two-factor authentication** - TOTP for teachers
- ✅ **Encrypted LocalStorage** - Protect roster if device stolen
- ✅ **Advanced monitoring** - Anomaly detection, brute force alerts
- ✅ **Penetration testing** - Third-party security audit
- ✅ **Bug bounty program** - Incentivize responsible disclosure

**Cost:** $500-2,000 (security audit + bug bounty)

---

### Iteration 2 (Month 7-12) - Enterprise Features
- ✅ **Single Sign-On (SSO)** - Integration with school identity providers (SAML, OAuth)
- ✅ **IP whitelisting** - Restrict access to school networks only
- ✅ **Encrypted cloud backup** - Roster backup with password-based encryption
- ✅ **Remote wipe** - Teacher can clear device data if lost
- ✅ **Security certifications** - Cyber Essentials Plus, ISO 27001

**Cost:** $2,000-10,000/year (certifications + compliance)

---

# Overall Summary & Recommendations

## MVP Priority Matrix

| Safety Challenge | MVP Must-Haves | Cost | Impact |
|-----------------|----------------|------|--------|
| **Inappropriate Photos** | Defer images, accept PDF/DOCX/text only | $0 | High (eliminates risk) |
| | File type validation + malware scanning | $0-20/month | High |
| **Inappropriate Text** | Input sanitization, PII detection, crisis keywords | $0 | Critical |
| | Rate limiting, length validation | $0 | Medium |
| **Bad Actor Access** | Zero-knowledge architecture (pseudonyms + E2E encryption) | $0 | Critical |
| | Strong auth (JWT + bcrypt), HTTPS, secure headers | $0 | Critical |
| | Access control, audit logging | $0 | High |

**Total MVP Safety Cost:** $0-20/month

---

## Key Architectural Decision: Zero-Knowledge by Design

The single most important safety mitigation is the **pseudonymous architecture** from legal-challenges.md Option D:

✅ **Server never stores student names**
- Even if bad actor breaches database → cannot identify students
- Even if government subpoenas data → cannot provide student names
- Even if employee goes rogue → cannot access personal data

✅ **Content encrypted end-to-end**
- Teacher holds decryption keys
- Server cannot read submission content
- Minimizes data breach impact

✅ **This architecture is your competitive moat**
- No competitor offers this level of privacy
- Unique selling point: "We never know your students' names"
- Lower legal risk + lower compliance costs

---

## Iteration Roadmap

### MVP (Month 1-3): Core Safety
Focus: **Prevent the most likely and highest-impact risks**
- No image uploads (defer to Iteration 1)
- Text content sanitization + PII detection + crisis keywords
- Zero-knowledge architecture (pseudonyms + encryption)
- Strong authentication + authorization
- HTTPS + secure headers
- Audit logging

**Goal:** Safe enough to test with 10 teachers, 300 students

---

### Iteration 1 (Month 4-6): Enhanced Security (Continue with PDF/DOCX only)
Focus: **Strengthen security without compromising privacy**
- Two-factor authentication for teachers
- Encrypted LocalStorage (protect roster if device stolen)
- Profanity filtering (server-side)
- Advanced PII detection
- Security audit (penetration testing)
- Bug bounty program

**Goal:** Production-ready for 50+ schools

**Note:** Image support deferred until privacy-preserving solution found (e.g., teacher-only review, self-hosted ML)

---

### Iteration 2 (Month 7-12): Enterprise Features
Focus: **Scale to 500+ schools**
- SSO integration
- Advanced threat detection
- Security certifications (Cyber Essentials Plus)
- Bug bounty program
- Compliance automation

**Goal:** Enterprise sales-ready

---

## Legal & Safeguarding Context

### UK Requirements for Child Protection
- **Keeping Children Safe in Education 2024** (statutory guidance)
- Teachers have duty to report safeguarding concerns
- Platform must not obstruct safeguarding processes
- Crisis detection + teacher alerts fulfills this duty

### GDPR Compliance
- Zero-knowledge architecture minimizes data protection obligations
- Pseudonyms likely not "personal data" (legal review recommended)
- No DPAs required with schools (not processing student names)
- Cost savings: £15,000-44,000 in Year 1 vs. storing real names

### Age-Appropriate Design Code (UK)
- Best interests of the child
- Data minimization (✅ pseudonyms comply)
- Transparent privacy notices (✅ must provide)
- No profiling/targeting for marketing (✅ not applicable)

---

## Final Recommendations

### ✅ DO This for MVP
1. **skip web hosting entirely** stay on localhost, clean data of last names BEFORE using
2. **Implement zero-knowledge architecture** (pseudonyms + E2E encryption)
3. **Defer image uploads** (text/PDF/DOCX only for MVP)
4. **Sanitize all text input** (XSS, injection prevention)
5. **Detect PII and crisis keywords** (warn students, alert teachers)
6. **Strong authentication** (JWT + bcrypt + password requirements)
7. **HTTPS everywhere** + secure headers
8. **Audit logging** (all security events)
9. **Incident response plan** (ready before launch)

### ❌ DON'T Do This for MVP
1. ❌ Don't support image uploads yet (defer to Iteration 1)
2. ❌ Don't auto-reject flagged content (flag for teacher review instead)
3. ❌ Don't skip security basics (HTTPS, input validation, access control)
4. ❌ Don't store plaintext passwords or unencrypted sensitive data
5. ❌ Don't assume "students won't do that" (they will)

### ⚠️ Get Legal Review Before School Adoption
- Pseudonymous architecture is strong, but not guaranteed GDPR-exempt
- Consult UK data protection lawyer (£500-1,000)
- Confirm safeguarding procedures meet "Keeping Children Safe in Education" standards
- Review privacy policy with legal counsel

---

**This document provides comprehensive mitigation strategies for all three safety challenges. Each mitigation includes technical implementation, cost, timeline, and trade-offs. The zero-knowledge architecture is your strongest defense and competitive advantage.**
