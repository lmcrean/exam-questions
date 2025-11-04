# Technical Challenges: Hypothesis 2 (AI Marking for Data Drops)

## Overview

Hypothesis 2 has significantly higher technical complexity than Hypothesis 1 due to two critical requirements:

1. **Multi-format submission processing** (PDF, DOCX, images, text) - extracting readable content for AI
2. **End-to-end encryption** for both student names AND student responses (GDPR/privacy compliance)

**Current State:** We have a deployed full-stack chatbot with infrastructure (database, API, auth, Claude integration). The challenge is building the **content extraction pipeline** and **encryption layer** on top of existing infrastructure.

These challenges must be solved for the product to work. If either fails, the hypothesis fails.

---

# Challenge 1: Multi-Format Content Extraction

## Core Requirement

**Problem:** Students submit coursework in various formats (Google Docs � PDF, Word � DOCX, handwritten � images, or direct text input). All these formats must be converted into text that Claude API can process.

**Why This Matters:** If teachers have to ask students to "retype your work," adoption dies. The tool must accept work as-is with zero friction.

**Key Insight:** We already have the chatbot infrastructure. This challenge is specifically about **reading/parsing different file formats** before feeding them to the existing Claude integration.

---

## Required Format Support (Priority Order)

### 1. Plain Text P (Already Works)
**Use Case:** Student types answer directly into web form
**Complexity:** None (chatbot already handles this)
**Decision:**  Include in MVP (already supported)

---

### 2. PDF PP (Essential for MVP)
**Use Case:** Student exports Google Docs to PDF
**Most common digital submission format**

#### Text-Based PDF (Recommended for MVP)
```python
import pdfplumber

def extract_text_from_pdf(file_path):
    with pdfplumber.open(file_path) as pdf:
        return "".join(page.extract_text() for page in pdf.pages)
```

**Library:** pdfplumber or PyMuPDF
**Accuracy:** 99%+ (text already in PDF)
**Cost:** Free

**Decision:**  MVP must support this

#### Image-Based PDF (Scanned - Defer to Iteration 2)
**Requires OCR:** Google Cloud Vision, Tesseract, or Claude Vision
**Complexity:** High
**Decision:** � Defer until validated demand

---

### 3. DOCX PP (Essential for MVP)
**Use Case:** Student works in Microsoft Word

```python
from docx import Document

def extract_text_from_docx(file_path):
    doc = Document(file_path)
    return "\n".join(p.text for p in doc.paragraphs)
```

**Library:** python-docx
**Accuracy:** 99%+
**Cost:** Free

**Decision:**  MVP must support this
**Note:** Reject .doc (old format) with clear error message

---

### 4. Images (PNG, JPG) PPPP (OCR Required)
**Use Case:** Student photographs handwritten work

#### Option A: Claude Vision API (Recommended)
```python
import anthropic
import base64

def extract_text_from_image(image_path):
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image_data}},
                {"type": "text", "text": "Extract all text from this image, preserving formatting."}
            ]
        }]
    )
    return response.content[0].text
```

**Pros:**
- Uses existing Claude integration
- Handles handwriting well
- Understands context (not just OCR)

**Cons:**
- Higher token cost
- Two-step process (OCR then mark)

**Decision:**  MVP support with Claude Vision
**Show extracted text to teacher for verification** ("AI read this - does it look right?")

---

## Batch Processing Architecture

**Critical Requirement:** Process 30-330 files at once (not one-at-a-time)

### Implementation
```python
import asyncio

async def process_submission(file_path, rubric):
    try:
        # 1. Extract text based on file type
        if file_path.endswith('.pdf'):
            text = extract_text_from_pdf(file_path)
        elif file_path.endswith('.docx'):
            text = extract_text_from_docx(file_path)
        elif file_path.endswith(('.jpg', '.png')):
            text = extract_text_from_image(file_path)
        else:
            text = file_path  # Already text

        # 2. Mark with AI (existing Claude integration)
        feedback = await mark_with_ai(text, rubric)

        return {"success": True, "text": text, "feedback": feedback}

    except Exception as e:
        return {"success": False, "error": str(e)}

async def process_batch(files, rubric):
    """Process all submissions in parallel"""
    tasks = [process_submission(f, rubric) for f in files]
    return await asyncio.gather(*tasks)
```

**Features:**
- Parallel processing (all 30 files at once)
- Error recovery (if 1 fails, others continue)
- Progress tracking ("Processing 15/30...")

---

# Challenge 2: End-to-End Encryption (Student Names + Responses)

## Core Privacy Requirement

**Problem:** GDPR compliance requires we **cannot store**:
- Student names
- Student responses (coursework content)

**But teachers must be able to**:
- View student names locally
- View student responses locally
- Mark and export grades

**Solution:** End-to-end encryption where sensitive data is **encrypted client-side** before sending to server, and **decrypted client-side** when displaying to teacher.

---

## What Gets Encrypted

### Server Never Sees (Plaintext):
1. L Student names ("John Smith")
2. L Student responses (essay content)
3. L Any personally identifiable information

### Server Stores (Encrypted):
1.  Random UUID per student
2.  Encrypted submission content
3.  AI feedback (not student-specific, can be plaintext)
4.  Grades (linked to UUIDs, not names)

### Teacher's Browser Stores (Plaintext, LocalStorage):
1.  UUID � Student Name mapping
2.  Decryption keys for responses

---

## Architecture: Zero-Knowledge E2E Encryption

```
Teacher's Browser (Local)              Server (Cloud)


1. Upload Class Roster
   ["John Smith", "Jane Doe"]          (nothing sent yet)
   �
2. Generate UUIDs (client-side)
   uuid-1234 � "John Smith"            (nothing sent yet)
   uuid-5678 � "Jane Doe"
   Store in localStorage
   �
3. Student Submits Work
   UUID: uuid-1234                     Receives: uuid-1234
   Content: "Essay about..."           Receives: <encrypted blob>
   �
   Encrypt content (client-side)       Stores encrypted content
   Key stored in teacher's browser     Cannot decrypt without key
   �
4. Send to Server
   POST /submit
   { student_id: "uuid-1234",          Stores in database
     content: "a8f3b2...",             (encrypted, unreadable)
     encrypted: true }
   �
5. AI Marking (Server)
   Server decrypts temporarily         Decrypts � Marks � Re-encrypts
   (using teacher's session key)       Stores grade + feedback
   �
6. Teacher Views Results
   Fetch from server:                  Returns:
   { student_id: "uuid-1234",          { student_id: "uuid-1234",
     content_encrypted: "a8f3b2...",     content_encrypted: "...",
     grade: "B",                         grade: "B",
     feedback: "..." }                   feedback: "..." }
   �
   Decrypt client-side:
   uuid-1234 � "John Smith"
   "a8f3b2..." � "Essay about..."
   �
   Display: "John Smith - Grade B"     Teacher sees decrypted data
```

---

## Implementation: Client-Side Encryption

### Option 1: Simple UUID Mapping (MVP - Recommended)

**How it works:**
- Student names never leave teacher's browser
- Server only knows UUIDs
- No encryption library needed (just mapping)

```javascript
// Teacher uploads roster (CSV: "John Smith, Jane Doe, ...")
function createRoster(studentNames) {
  const roster = {};
  studentNames.forEach(name => {
    const uuid = crypto.randomUUID();  // Browser API
    roster[uuid] = name;
  });

  // Store locally (never sent to server)
  localStorage.setItem('roster', JSON.stringify(roster));

  // Generate student submission links
  return Object.keys(roster).map(uuid => ({
    uuid,
    link: `https://yourapp.com/submit/${uuid}`
  }));
}

// When displaying results
function displayResults(serverData) {
  const roster = JSON.parse(localStorage.getItem('roster'));

  serverData.forEach(result => {
    const studentName = roster[result.student_id];  // Decrypt
    console.log(`${studentName}: ${result.grade}`);
  });
}
```

**Pros:**
-  Simple (no crypto library)
-  Server never sees student names
-  GDPR compliant

**Cons:**
- L If teacher clears browser � roster lost
- L Single device only

**Decision:**  Start here for MVP

---

### Option 2: Encrypted Content Storage (MVP + Iteration 1)

**For student responses (coursework content)**, we need actual encryption since content is sent to server for AI marking.

```javascript
import CryptoJS from 'crypto-js';

// Teacher generates encryption key (client-side, stored in localStorage)
const encryptionKey = CryptoJS.lib.WordArray.random(256/8).toString();
localStorage.setItem('encryption_key', encryptionKey);

// Student submits work � encrypt before sending
async function submitWork(studentUuid, content) {
  const key = localStorage.getItem('encryption_key');
  const encrypted = CryptoJS.AES.encrypt(content, key).toString();

  await fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentUuid,
      content_encrypted: encrypted
    })
  });
}

// Server marks (must decrypt, but only in memory, never stores plaintext)
async function markSubmission(encryptedContent, teacherKey, rubric) {
  // Decrypt in memory
  const plaintext = CryptoJS.AES.decrypt(encryptedContent, teacherKey).toString(CryptoJS.enc.Utf8);

  // Send to AI
  const feedback = await markWithAI(plaintext, rubric);

  // Don't store plaintext! Only store grade + feedback
  return { grade: feedback.grade, feedback: feedback.comments };
}

// Teacher views � decrypt client-side
async function viewSubmission(encryptedContent) {
  const key = localStorage.getItem('encryption_key');
  const plaintext = CryptoJS.AES.decrypt(encryptedContent, key).toString(CryptoJS.enc.Utf8);
  return plaintext;
}
```

**Key Points:**
- Teacher's encryption key stored in browser (localStorage)
- Content encrypted before sending to server
- Server decrypts only temporarily for AI marking (in memory, not stored)
- Teacher decrypts when viewing results

**Decision:**  Implement for MVP (required for GDPR compliance if storing responses)

---

### Option 3: Password-Encrypted Cloud Backup (Iteration 1)

**Problem:** If teacher clears browser data or switches devices, roster + keys are lost.

**Solution:** Encrypt roster + keys with teacher's password, store encrypted blob on server.

```javascript
// Backup encrypted roster to server
async function backupToCloud(roster, password) {
  const encryptedRoster = CryptoJS.AES.encrypt(
    JSON.stringify(roster),
    password
  ).toString();

  await fetch('/api/backup', {
    method: 'POST',
    body: JSON.stringify({ encrypted_data: encryptedRoster })
  });
}

// Restore from cloud
async function restoreFromCloud(password) {
  const response = await fetch('/api/restore');
  const { encrypted_data } = await response.json();

  const decryptedRoster = CryptoJS.AES.decrypt(
    encrypted_data,
    password
  ).toString(CryptoJS.enc.Utf8);

  return JSON.parse(decryptedRoster);
}
```

**Pros:**
- Multi-device support
- Server still can't read data (encrypted with teacher's password)

**Cons:**
- If teacher forgets password � data permanently lost
- More complex UX

**Decision:** � Defer to Iteration 1

---

## Database Schema (GDPR-Compliant)

### What We Store

```sql
-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  teacher_id UUID,  -- Links to teacher (not students)
  title TEXT,
  rubric JSON,
  created_at TIMESTAMP
);

-- Submissions (NO PLAINTEXT STUDENT DATA)
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  assignment_id UUID,
  student_identifier UUID,  -- Random UUID (not name)
  content_encrypted BYTEA,   -- Encrypted content (teacher can decrypt)
  ai_grade TEXT,             -- Grade is not PII
  ai_feedback TEXT,          -- Feedback is not PII
  teacher_reviewed BOOLEAN,
  created_at TIMESTAMP
);
```

### What We DON'T Store
- L Student names
- L Student email addresses
- L Plaintext student responses

---

## GDPR Compliance Checklist

-  **No PII on server** (student names encrypted/never sent)
-  **Content encrypted end-to-end** (teacher holds keys)
-  **Data minimization** (only store UUIDs, grades, encrypted content)
-  **Right to be forgotten** (teacher deletes assignment � all data deleted)
-  **Data portability** (export grades as CSV)
-  **Encryption in transit** (HTTPS)
-  **Encryption at rest** (database encrypted)

---

## User Experience (With E2E Encryption)

### Teacher Workflow

1. **Create Assignment**
   - Upload class roster (CSV with student names)
   - Browser generates UUIDs for each student
   - Roster stored locally (never sent to server)
   - Teacher receives submission links per student

2. **Students Submit**
   - Teacher shares link: `yourapp.com/submit/uuid-1234`
   - Student uploads work
   - Content encrypted client-side before sending
   - Server receives encrypted blob + UUID (no name)

3. **AI Marking**
   - Server temporarily decrypts content (in memory)
   - Sends to Claude API
   - Stores grade + feedback (not student-identifiable)

4. **Teacher Review**
   - Teacher opens grading interface
   - Browser decrypts UUIDs � shows "John Smith"
   - Browser decrypts content � shows essay text
   - Teacher sees: "John Smith - Grade B - 'Great analysis...'"

5. **Export**
   - Teacher exports CSV with decrypted names
   - Server never sees this CSV

### Edge Cases
- Teacher clears browser data � roster lost (need to re-upload)
- Teacher switches device � need Option 3 (encrypted cloud backup)
- Student loses submission link � teacher can regenerate from roster

---

## Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **File extraction fails** (corrupt PDF) | Medium | Detect errors, show teacher, allow manual text entry |
| **OCR accuracy <80%** (poor handwriting) | Medium | Show extracted text for teacher verification |
| **Teacher loses encryption key** | High | Encrypted cloud backup (Option 3) in Iteration 1 |
| **GDPR audit failure** | Fatal | Legal review of encryption architecture |
| **Batch processing timeout** (330 files) | Medium | Process in chunks, use job queue |
| **Claude API rate limits** | Medium | Implement rate limiting, queue requests |

---

## Cost Analysis (With Encryption)

### Per-Submission Cost

**Text/PDF/DOCX (no OCR):**
- Input tokens: 500 words � 1.3 = 650 tokens
- Output tokens: grade + feedback = 200 tokens
- Cost: (650 � $3/1M) + (200 � $15/1M) = **$0.005** (~0.5�)

**Images (OCR via Claude Vision):**
- Image processing: ~1000 tokens
- Then marking: 650 + 200 tokens
- Cost: ((1000 + 650) � $3/1M) + (200 � $15/1M) = **$0.008** (~0.8�)

**Encryption overhead:** Negligible (client-side, no API costs)

**For 330 students � 3 data drops/year:**
- Cost: $0.005 � 330 � 3 = **$4.95/year**
- Revenue (�8/month): **�96/year**
- **Gross margin: 95%+**

---

## MVP Technical Scope

### Week 1-2: Core Features
-  File upload (text, PDF, DOCX)
-  Content extraction (pdfplumber, python-docx)
-  UUID generation (client-side)
-  Encrypted content storage
-  AI marking (existing Claude integration)

**Validation:** Upload 30 test files, verify extraction + encryption works

### Week 2-3: E2E Encryption
-  Local roster storage (localStorage)
-  Client-side encryption (CryptoJS)
-  UUID � Name mapping (client-side decrypt)
-  Server stores only encrypted content

**Validation:** Privacy audit (server logs show no student names)

### Week 3-4: Batch Processing
-  Multi-file upload (30 files)
-  Parallel processing (async)
-  Progress tracking
-  Error handling

**Validation:** 1 teacher, 30 students, full workflow

### Week 4+: Image Support (If Needed)
-  Image upload
-  Claude Vision OCR
-  Text verification UI

**Validation:** Test with 10 handwritten submissions

---

## Success Criteria

MVP succeeds if:

1.  **File extraction: 95%+ accuracy** (PDF, DOCX)
2.  **Batch processing: <2 min for 30 files**
3.  **Encryption: Server never sees student names** (verified in logs)
4.  **Cost: <$0.01 per submission**
5.  **UX: Teacher says "privacy + upload was easy"**

MVP fails if:

- L File extraction <90% accuracy
- L GDPR lawyer says "not compliant"
- L Encryption keys lost � teacher loses data
- L Too complex for teachers to use

---

## Comparison: Hypothesis 1 vs Hypothesis 2

| Aspect | Hypothesis 1 (Exam Practice) | Hypothesis 2 (Data Drops) |
|--------|------------------------------|---------------------------|
| **Input formats** | Text only (typed in lesson) | PDF, DOCX, images, text |
| **File parsing** | Not needed | Essential (high complexity) |
| **Privacy risk** | Low (ephemeral, in-class) | High (long-term, official grades) |
| **E2E encryption** | Optional | **Essential** |
| **Batch processing** | Not needed (real-time) | **Essential** (330 files) |
| **Technical complexity** | PP Low | PPPP High |

**Conclusion:** Hypothesis 2 is significantly more complex technically. Must validate file parsing + encryption in Week 1-2 before committing to full build.

---

# Challenge 3: Google Classroom Integration (Import/Export)

## Core Requirement

**Problem:** Teachers already use Google Classroom for assignments. To reduce friction, we need to:
1. **Import student submissions** from Google Classroom (avoid re-uploading)
2. **Export grades** back to Google Classroom (avoid manual entry)

**Why This Matters:** If teachers have to manually download 330 files from Google Classroom and re-upload them to our tool, adoption dies. Integration must be seamless.

---

## Google Classroom API (FREE)

**Good News:** The Google Classroom API is **completely free** to use for non-Google services.

**What's Available:**
- CourseWork API: Read assignments, create new assignments
- StudentSubmissions API: Read student submissions, update grades
- OAuth 2.0 authentication: Request permission from teachers
- REST API with client libraries (Python, JavaScript, Node.js)

**Documentation:**
- API Overview: developers.google.com/classroom
- REST Reference: developers.google.com/workspace/classroom/reference/rest

---

## What We Can Import (Read Access)

### 1. Course Information
```javascript
// List all courses for the authenticated teacher
GET https://classroom.googleapis.com/v1/courses
```

Returns: Course ID, name, section, teacher info

### 2. Assignments (CourseWork)
```javascript
// Get all assignments for a course
GET https://classroom.googleapis.com/v1/courses/{courseId}/courseWork
```

Returns: Assignment title, description, due date, max points, materials

### 3. Student Submissions
```javascript
// Get all student submissions for an assignment
GET https://classroom.googleapis.com/v1/courses/{courseId}/courseWork/{courseWorkId}/studentSubmissions
```

Returns:
- Student ID (Google user ID, not name directly)
- Submission state (NEW, CREATED, TURNED_IN, RETURNED, RECLAIMED_BY_STUDENT)
- Attachments (links to Google Docs, Drive files, or uploaded files)
- Current grade (if already graded)
- Draft grade

### 4. Student Files (via Drive API)
- Student submissions often include Google Docs links or Drive file attachments
- We can use the Drive API to download these files
- Requires additional Drive API OAuth scopes

---

## What We Can Export (Write Access)

### 1. Update Grades
```javascript
// Update a student submission with a grade
PATCH https://classroom.googleapis.com/v1/courses/{courseId}/courseWork/{courseWorkId}/studentSubmissions/{submissionId}
{
  "assignedGrade": 85.0
}
```

**Requirements:**
- Must have teacher permissions
- Can only modify submissions if our app created the assignment OR the submission is `associatedWithDeveloper`

### 2. Add Feedback Comments
```javascript
// Add feedback to a student submission
POST https://classroom.googleapis.com/v1/courses/{courseId}/courseWork/{courseWorkId}/studentSubmissions/{submissionId}:modifyAttachments
```

Can attach feedback as comments or Drive files

### 3. Return Graded Work
```javascript
// Return graded work to students
POST https://classroom.googleapis.com/v1/courses/{courseId}/courseWork/{courseWorkId}/studentSubmissions/{submissionId}:return
```

Changes state from TURNED_IN to RETURNED (student can now see the grade)

---

## Critical Limitation: associatedWithDeveloper

**Problem:** Student submissions can only be modified by the Developer Console project that created the corresponding CourseWork.

**What This Means:**
- If a teacher creates an assignment in Google Classroom (not through our app), we **cannot update grades** via API
- We can READ the submissions, but cannot WRITE grades back
- We can only write grades if the assignment was created through our app

**Workarounds:**

### Option A: Create Assignments Through Our App (Full Write Access)
```javascript
// Create a new assignment via our app
POST https://classroom.googleapis.com/v1/courses/{courseId}/courseWork
{
  "title": "Essay on Shakespeare",
  "description": "Write a 500-word essay...",
  "workType": "ASSIGNMENT",
  "maxPoints": 100
}
```

**Pros:**
- ✅ Full read/write access to submissions and grades
- ✅ Can update grades programmatically

**Cons:**
- ❌ Teachers must create assignments through our app (not Google Classroom directly)
- ❌ Friction for existing workflows

---

### Option B: Import Submissions (Read-Only), Manual Grade Export
```javascript
// Teacher selects existing assignment
// We fetch all submissions via API
GET /v1/courses/{courseId}/courseWork/{courseWorkId}/studentSubmissions

// We process and grade submissions in our app
// BUT: Cannot write grades back via API

// Solution: Export CSV
// Teacher manually copies grades to Google Classroom
```

**Pros:**
- ✅ Works with existing Google Classroom assignments
- ✅ No workflow change for assignment creation

**Cons:**
- ❌ Manual grade export (CSV download, copy-paste to Google Classroom)
- ❌ Not fully automated

---

### Option C: Hybrid Approach (Recommended for MVP)

**Phase 1: Import submissions (read-only) + CSV export**
1. Teacher authenticates with Google OAuth
2. Teacher selects existing Google Classroom assignment
3. We fetch all student submissions via API
4. We download attached files (Google Docs, PDFs) via Drive API
5. We process and grade submissions in our app
6. Teacher exports grades as CSV
7. Teacher manually imports CSV to Google Classroom (or copies grades)

**Phase 2: Create assignments through our app (full access)**
1. For new assignments, teacher creates via our app
2. Our app creates the assignment in Google Classroom via API
3. Students submit work in Google Classroom
4. We fetch submissions via API
5. We process and grade submissions
6. We write grades back to Google Classroom via API (fully automated)

**Why This Works:**
- MVP: Works with existing teacher workflows (import existing assignments)
- Iteration 1: Offer full automation for teachers willing to create assignments through our app
- Teachers choose based on their preference (convenience vs automation)

---

## OAuth Scopes Required

### For Read Access (Import Submissions)
```
https://www.googleapis.com/auth/classroom.courses.readonly
https://www.googleapis.com/auth/classroom.coursework.students.readonly
https://www.googleapis.com/auth/classroom.student-submissions.students.readonly
https://www.googleapis.com/auth/drive.readonly  # For downloading student files
```

### For Write Access (Export Grades)
```
https://www.googleapis.com/auth/classroom.coursework.students
https://www.googleapis.com/auth/classroom.student-submissions.students
```

**User Experience:**
- Teacher clicks "Connect Google Classroom"
- OAuth popup asks: "Allow [Your App] to view and manage Google Classroom courses, assignments, and grades?"
- Teacher approves
- Our app stores OAuth tokens securely

---

## Implementation (MVP)

### Step 1: OAuth Setup
```javascript
// Use Google OAuth 2.0 library
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://yourapp.com/oauth/callback'
);

// Redirect teacher to Google for authorization
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
  ]
});

// After teacher approves, exchange code for tokens
const { tokens } = await oauth2Client.getToken(code);
oauth2Client.setCredentials(tokens);
```

---

### Step 2: List Courses and Assignments
```javascript
import { google } from 'googleapis';

const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

// List all courses
const courses = await classroom.courses.list();

// List assignments for a course
const courseWork = await classroom.courses.courseWork.list({
  courseId: selectedCourseId
});
```

---

### Step 3: Fetch Student Submissions
```javascript
// Get all submissions for an assignment
const submissions = await classroom.courses.courseWork.studentSubmissions.list({
  courseId: courseId,
  courseWorkId: courseWorkId
});

// Example submission structure:
// {
//   id: "submission123",
//   userId: "student-google-id",
//   state: "TURNED_IN",
//   assignmentSubmission: {
//     attachments: [
//       { driveFile: { id: "file-id-123", title: "Essay.pdf" } }
//     ]
//   },
//   assignedGrade: null  // Not yet graded
// }
```

---

### Step 4: Download Student Files
```javascript
import { google } from 'googleapis';

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Download file from Google Drive
async function downloadFile(fileId) {
  const response = await drive.files.export({
    fileId: fileId,
    mimeType: 'application/pdf'  // Export Google Docs as PDF
  }, { responseType: 'arraybuffer' });

  return response.data;  // PDF buffer
}
```

---

### Step 5: Process and Grade
```javascript
// For each submission:
for (const submission of submissions) {
  // 1. Download file
  const fileId = submission.assignmentSubmission.attachments[0].driveFile.id;
  const pdfBuffer = await downloadFile(fileId);

  // 2. Extract text (use Challenge 1 techniques)
  const text = extractTextFromPDF(pdfBuffer);

  // 3. Grade with AI
  const feedback = await markWithAI(text, rubric);

  // 4. Store results (encrypted, Challenge 2)
  await storeGrade(submission.userId, feedback.grade, feedback.comments);
}
```

---

### Step 6: Export Grades (MVP - CSV)
```javascript
// Generate CSV for teacher to manually import
function exportGradesCSV(gradedSubmissions) {
  const csv = gradedSubmissions.map(s =>
    `${s.studentName},${s.grade},${s.feedback}`
  ).join('\n');

  return csv;
}

// Teacher downloads CSV and manually imports to Google Classroom
```

---

### Step 7: Export Grades (Iteration 1 - API)
```javascript
// Only works if we created the assignment!
async function exportGradesToClassroom(gradedSubmissions) {
  for (const submission of gradedSubmissions) {
    await classroom.courses.courseWork.studentSubmissions.patch({
      courseId: courseId,
      courseWorkId: courseWorkId,
      id: submission.submissionId,
      updateMask: 'assignedGrade',
      requestBody: {
        assignedGrade: submission.grade
      }
    });

    // Return graded work to student
    await classroom.courses.courseWork.studentSubmissions.return({
      courseId: courseId,
      courseWorkId: courseWorkId,
      id: submission.submissionId
    });
  }
}
```

---

## Privacy Considerations (GDPR + Google Classroom)

**Student Names:**
- Google Classroom API returns student user IDs (Google account IDs)
- We can fetch student names via the UserProfiles API
- OR: Teacher can upload roster CSV with names (our existing approach)

**Data Storage:**
- If we fetch student names from Google, we must encrypt them (Challenge 2)
- OAuth tokens must be stored securely (encrypted at rest)
- Refresh tokens allow long-term access (teacher doesn't need to re-authorize)

**GDPR Compliance:**
- ✅ We only access data teacher explicitly authorizes (OAuth consent)
- ✅ We don't share data with third parties
- ✅ Teacher can revoke access at any time (Google Account settings)
- ✅ We encrypt student data before storage (Challenge 2)

---

## Cost Analysis

### Google Classroom API
- **Cost:** FREE (no usage fees)
- **Rate Limits:**
  - 1500 queries per 100 seconds per project
  - Sufficient for typical use (330 students = ~330 API calls per batch)

### Google Drive API (for downloading files)
- **Cost:** FREE
- **Rate Limits:**
  - 10,000 queries per 100 seconds per project
  - Sufficient for batch downloads

**Conclusion:** Integration is completely free, only requires development time.

---

## User Experience (With Google Classroom Integration)

### Teacher Workflow (MVP - Read-Only Import)

1. **Connect Google Classroom**
   - Click "Import from Google Classroom"
   - Authorize our app via OAuth popup
   - See list of their courses

2. **Select Assignment**
   - Choose course (e.g., "Year 8 English")
   - Choose assignment (e.g., "Shakespeare Essay")
   - See 30 student submissions

3. **Import Submissions**
   - Click "Import All Submissions"
   - We fetch submissions via API
   - We download files from Google Drive
   - Progress: "Importing 15/30 submissions..."

4. **AI Grades**
   - We process and grade all submissions
   - Teacher reviews grades in our app
   - Teacher adjusts grades as needed

5. **Export Grades**
   - Click "Export Grades"
   - Download CSV with student names + grades
   - Teacher manually imports CSV to Google Classroom
   - (Or copies grades one-by-one)

### Teacher Workflow (Iteration 1 - Full Automation)

1. **Create Assignment Through Our App**
   - Fill in assignment details in our app
   - Click "Create in Google Classroom"
   - Assignment appears in Google Classroom automatically

2. **Students Submit in Google Classroom**
   - Students work as usual (no change for them)
   - Students submit work in Google Classroom

3. **Auto-Import and Grade**
   - Our app detects new submissions (webhook or polling)
   - Automatically imports and grades submissions
   - Teacher receives notification: "30 submissions graded"

4. **Review and Export**
   - Teacher reviews grades in our app
   - Click "Send Grades to Google Classroom"
   - Grades appear in Google Classroom automatically
   - Students receive graded work

**Time Savings:**
- MVP: Saves time on marking (manual grade export)
- Iteration 1: Saves time on marking + grade entry (fully automated)

---

## Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **OAuth setup complexity** | Medium | Use official Google OAuth library, test early |
| **API rate limits exceeded** (330 students) | Medium | Batch requests, implement exponential backoff |
| **Cannot write grades** (existing assignments) | High | Clear UX: "Import-only mode" with CSV export |
| **File download failures** (Drive API) | Medium | Retry logic, show errors to teacher |
| **Token expiration** (teacher must re-auth) | Low | Use refresh tokens for long-term access |
| **Google API changes** | Low | Monitor deprecation notices, use versioned API |

---

## MVP Technical Scope

### Week 1: OAuth Setup
- ✅ Register app in Google Developer Console
- ✅ Implement OAuth 2.0 flow
- ✅ Securely store tokens (encrypted)

**Validation:** Teacher can authorize and see their courses

### Week 2: Import Submissions
- ✅ List courses and assignments
- ✅ Fetch student submissions
- ✅ Download files from Google Drive
- ✅ Handle errors (missing files, permissions)

**Validation:** Successfully import 30 submissions from test course

### Week 3: Grade Export (CSV)
- ✅ Generate CSV with student names + grades
- ✅ Teacher downloads CSV
- ✅ Instructions for manual import to Google Classroom

**Validation:** Teacher can import CSV to Google Classroom

### Iteration 1: Automated Grade Export
- ✅ Create assignments via our app
- ✅ Write grades back to Google Classroom via API
- ✅ Return graded work to students

**Validation:** End-to-end automation (create → grade → export)

---

## Success Criteria

MVP succeeds if:

1. ✅ **OAuth works smoothly** (teacher authorizes in <30 seconds)
2. ✅ **Import works for 95%+ of submissions** (files download successfully)
3. ✅ **CSV export is clear** (teacher understands how to import grades)
4. ✅ **Cost: $0** (Google Classroom API is free)
5. ✅ **Teacher says:** "This saved me from re-uploading 30 files"

MVP fails if:

- ❌ OAuth is confusing or fails
- ❌ Cannot download files from Google Drive (<80% success rate)
- ❌ API rate limits block batch processing
- ❌ Too complex for teachers to use

---

## Competitive Advantage

**CoGrader (competitor) has Google Classroom integration:**
- They import submissions from Google Classroom
- They export grades back to Google Classroom
- This is a **table stakes feature** for any AI marking tool targeting teachers

**Conclusion:** We MUST have Google Classroom integration for MVP. Without it, teachers will choose CoGrader or other tools that already integrate.

**Recommended Approach:**
- MVP: Import submissions (read-only) + CSV export
- Iteration 1: Full automation (create assignments, auto-export grades)

---

## Build vs Buy Decision

### Could we use existing tools?

- **Turnitin / EssayGrader:** Don't offer E2E encryption (they store student data)
- **Google Classroom API:** Could handle file upload, but we'd still need encryption layer
- **Off-the-shelf OCR:** Still need integration + batch processing

**Conclusion:** Must build custom solution. No existing tool offers E2E encryption + UK KS3 workflow + batch AI marking.

---

## Recommended Approach

1. **Week 1:** Build file parsing (PDF, DOCX) + test with 30 real files
   - If extraction <90% accurate � hypothesis fails

2. **Week 2:** Build E2E encryption + test with privacy audit
   - If GDPR non-compliant � hypothesis fails

3. **Week 3:** Build batch processing + test with 1 teacher
   - If workflow too complex � simplify or pivot

4. **Week 4:** Validate with 3 teachers, 30 students each
   - If 2+ say "I'd use this" � build full MVP
   - Otherwise � pivot to Hypothesis 1 or different approach

**Critical Path:** File parsing + E2E encryption must work simply and reliably, or the entire hypothesis is not viable.
