# Project Iteration Roadmap

## Iteration 1: Live Response Display
Basic teacher-hosted session where students can upload answers and see them displayed live on the board.

**Essential Features:**
- Students can submit text-based answers to questions
- Students see the exam question in text
- Responses display live on teacher's presentation board
- Similar to Mentimeter but with long-form responses
- Teacher decides when to "reveal" everyone's answers
- Teacher can see % of submissions waiting for submission.
- Students see the mark scheme in text (after reveal), mark by hand
- Real-time updates as students submit

### 1.1.2 Teacher Image hosting and formatting

- Teacher can screenshot markschemes/ questions and copy and paste
- Code is formatted and options for bold and italics.

### 1.2: Teacher Answer Sorting
- Teacher can sort student answers
- Quickly identify the best/most relevant answers for discussion

### 1.3: Student Peer Voting
- Students can vote for the best answer once responses are revealed
- Peer learning and engagement feature
- Compare peer preferences with teacher assessment

### 1.4 Teacher on-screen marking
- red pen/green pen/ purple pen

### 1.5 Students self-assess / Heatmap
- teacher manually identifies mark fields
- look at mark scheme
- students self-assess after submission/ reveal
- students submit answers
- teacher heatmap

### 1.6 Peer-review self-assessment

- peers check a random student for their assessment
- agree/update marks

### 1.7 highlights/ commentary

- peers can leave inline comments
- can highlight green yellow
- teachers can do the same.

---

## Iteration 2: Smartphone OCR

This is to save time/ and reduce workflow time/ effort.

Enable students to submit work via smartphone images for faster submission.

**Features:**
- Upload images from smartphones
- OCR reading to extract text from images
- Correction interface before final submission
- Faster workflow for handwritten or existing work

---

## Iteration 3: AI-Powered Marking

Intelligent marking system using Gemini API to provide instant feedback and class insights.

**Features:**
- Break down mark scheme into discrete fields
- Define criteria for each mark (e.g., "for loop present", "return statements used")
- Extract code/answer examples automatically
- Assign marks to each student instantly via Gemini API
- Display marks in real-time (not saved to SQL)
- Generate whole-class trends showing:
  - Heat map for each field (red to green scale)
  - Most common strengths/weaknesses across the class
  - Visual representation of which criteria students struggle with most
- Compare with self-assessment/peer-assessment
---

## Iteration 3: revision flashcards

## Iteration N: multi-teacher auth

- teachers sign up with email

### N.2 google quick auth

## Iteration N: Saving sessions long-term

- requires 2 teacher sign up (department)

## Iteration N: revision flashcards before question

- teacher can add custom powerpoint/PDF to view before question

### N.2 AI flashcards

## Technical Notes

### Data Persistence
- Iterations 1-2: Store responses in SQL NeonDB
- Iteration 3: Marks displayed transiently (not persisted), allow for flexible experimentation

### API Integration
- Iteration 3 requires Gemini API integration
- Need to design prompt structure for consistent mark scheme evaluation
