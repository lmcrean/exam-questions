# Shared Components

## Overview
This directory contains reusable UI components used across both teacher and student views in the Exam Response App. These components ensure consistency and reduce duplication.

---

## Component Index

### 1. Response Card (`response-card.md`)
**Purpose**: Display student responses with multi-source marking indicators

**Key Features**:
- Preview of response content
- Colored dots for marks: 🔴 Teacher, 🟢 Self, 🔵 Peer, 🟣 AI
- Progressive disclosure (marks appear as they're added)
- Multiple view variants (compact, grid, with ranking)
- Interactive hover states showing mark details

**Used In**:
- Teacher: Response list, review stage, results stage, assessment stage
- Student: Viewing own response, peer review interface, results

**Integration**:
```
Response cards show marks in top-right corner:
🔴 85 🟢 78 🔵 82 🟣 90

Click card → Opens expanded view (response-card-expanded.md)
Hover dots → Shows mark labels
```

---

### 2. Response Card - Expanded (`response-card-expanded.md`)
**Purpose**: Full detailed view of a single response with expandable marking breakdowns

**Key Features**:
- Complete response text and images
- Click colored dots to expand detailed rubric breakdown
- Each mark type shows:
  - Teacher: Rubric scores, feedback, grader name
  - Self: Student's scores, reflection, calibration feedback
  - Peer: Individual reviewer breakdown, variance, comments
  - AI: Automated analysis, detected concepts, suggestions
- Comparison view showing all marks side-by-side
- Statistics and metadata

**Used In**:
- Teacher: Detailed response review, marking interface, analytics drill-down
- Student: Viewing feedback, understanding marks, reflection

**Integration**:
```
Click response card → Opens expanded view
Click 🔴/🟢/🔵/🟣 → Expands that mark section
Click "Compare All" → Shows side-by-side rubric comparison
```

---

### 3. AI Heatmap (`ai-heatmap.md`)
**Purpose**: Visual analytics showing class-wide performance patterns

**Key Features**:
- Response quality heatmap (student × criteria matrix)
- Concept coverage map (which concepts each student understood)
- Common error patterns (AI-identified misconceptions)
- Mark distribution comparison across mark types
- Similarity clusters (grouping students by approach)
- Actionable recommendations for intervention
- Student view (anonymized, teacher-controlled)

**Used In**:
- Teacher: Assessment stage analytics dashboard, post-session review
- Student: Self-awareness of performance vs class (if enabled)

**Better Than Graide's Bar Charts**:
- ❌ Graide: Simple grade histogram, no insight into what students struggle with
- ✅ Our Heatmap: See exactly which students need help with which concepts, identify patterns, get AI recommendations

**Integration**:
```
Assessment Stage → Click [📊 View Analytics] → Opens heatmap
Heatmap cell click → Drill down to individual student analysis
Can export as PNG, PDF, CSV for reports
```

---

### 4. Invite Banner (`invite-banner.md`)
**Purpose**: Display session code and joining instructions

**Key Features**:
- Multiple formats (full-screen presentation, compact banner, card)
- Session code with copy-to-clipboard
- QR code generation for instant join
- Email link option
- Auto-generated 6-character codes
- Real-time join counter

**Used In**:
- Teacher: Session creation, presentation mode, dashboard
- Student: Join screen, in-session header

**Integration**:
```
Teacher creates session → Auto-generates code (e.g., ABC123)
Click [🖥️ Present] → Full-screen view with large code + QR
Click [📋] → Copy code to clipboard
Click [📱] → Show QR code modal
Students: Visit examresponse.app, enter code or scan QR
```

---

## Component Relationships

```
Session Flow:
┌────────────────────────────────────────────────────────┐
│ 1. Teacher creates session                             │
│    → invite-banner.md shows code                       │
│                                                        │
│ 2. Students join                                       │
│    → invite-banner.md (join screen)                    │
│                                                        │
│ 3. Submission stage                                    │
│    → response-card.md shows responses (no marks yet)   │
│                                                        │
│ 4. Review/Voting stage                                 │
│    → response-card.md with voting data                 │
│                                                        │
│ 5. Assessment stage (marking)                          │
│    → response-card.md shows progressive marks          │
│    → Click card → response-card-expanded.md            │
│    → Click colored dots → See detailed breakdown       │
│                                                        │
│ 6. Analytics (after marking complete)                  │
│    → [📊 View Analytics] button appears                │
│    → ai-heatmap.md shows class insights                │
│    → Click heatmap cell → response-card-expanded.md    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Mark Color System (Consistent Across All Components)

| Color | Emoji | Meaning | CSS Variable |
|-------|-------|---------|--------------|
| Red | 🔴 | Teacher Mark | `--mark-teacher: #EF4444` |
| Green | 🟢 | Self-Assessment | `--mark-self: #10B981` |
| Blue | 🔵 | Peer Mark (avg) | `--mark-peer: #3B82F6` |
| Purple | 🟣 | AI Mark | `--mark-ai: #A855F7` |

**Display Order**: Always 🔴 🟢 🔵 🟣 (left to right)

**Visibility Rules**:
- Show only marks that exist
- Teacher view: See all marks
- Student view: See own marks, AI if enabled, teacher after release
- Hover: Show label (e.g., "Teacher: 85/100")
- Click: Expand detailed breakdown (in expanded view)

---

## Responsive Design Patterns

All components follow these principles:

### Desktop (> 1024px)
- Full layout with all features
- Side-by-side comparisons
- Hover interactions

### Tablet (768px - 1024px)
- Stacked layouts
- Collapsible sections
- Touch-friendly targets

### Mobile (< 768px)
- Vertical stack only
- Tap interactions
- Simplified views
- Swipe navigation
- Bottom sheets for details

---

## Accessibility

All components include:
- **Color Blind Support**: Alternative patterns in heatmap, text labels
- **Screen Reader**: ARIA labels on all interactive elements
- **Keyboard Navigation**: Full keyboard support
- **High Contrast**: Meets WCAG AA standards
- **Focus Indicators**: Clear visible focus states

---

## Usage Examples

### Example 1: Teacher Views Response List

```markdown
Teacher opens "All Responses" view:
- Uses response-card.md component
- Each card shows: 🔴 85 🟢 78 🔵 82 🟣 90
- Clicks card → Opens response-card-expanded.md
- Clicks 🟣 (AI mark) → Expands AI analysis section
- Sees rubric breakdown, detected concepts, suggestions
```

### Example 2: Student Receives Feedback

```markdown
Student views own response after marking:
- Uses response-card.md (shows own marks)
- Sees: 🟢 78 🟣 90 🔴 85 (self, AI, teacher)
- Clicks to expand → response-card-expanded.md
- Clicks 🟢 → Sees own self-assessment with calibration
- Sees: "You underestimated yourself by 7 points!"
```

### Example 3: Teacher Analyzes Class Performance

```markdown
Teacher clicks [📊 View Analytics]:
- Opens ai-heatmap.md component
- Sees color-coded matrix: student × criteria
- Identifies: 3 students confused O(n²) with O(2n)
- Clicks on student name → response-card-expanded.md
- Reviews specific errors
- Exports analytics report (PDF)
```

### Example 4: Students Join Session

```markdown
Teacher opens presentation mode:
- invite-banner.md displays full screen
- Shows: "examresponse.app • Code: ABC123"
- QR code visible for scanning
- Students scan → Auto-join
- Teacher sees: "📊 15 students joined"
```

---

## Implementation Notes

### Data Structure

```json
{
  "response": {
    "id": "resp_123",
    "studentId": "Dancing Penguin 42",
    "content": "The time complexity...",
    "images": ["url1.jpg", "url2.jpg"],
    "wordCount": 842,
    "submittedAt": "2025-11-04T14:34:00Z",
    "marks": {
      "teacher": {
        "score": 85,
        "max": 100,
        "rubric": {...},
        "feedback": "Excellent explanation...",
        "graderId": "teacher_123",
        "gradedAt": "2025-11-04T15:20:00Z"
      },
      "self": {
        "score": 78,
        "max": 100,
        "rubric": {...},
        "reflection": "I feel like...",
        "assessedAt": "2025-11-04T14:40:00Z"
      },
      "peer": {
        "score": 82,
        "max": 100,
        "reviews": [...],
        "variance": 4.2,
        "count": 5
      },
      "ai": {
        "score": 90,
        "max": 100,
        "rubric": {...},
        "analysis": {...},
        "concepts": [...],
        "suggestions": [...],
        "confidence": 0.94,
        "analyzedAt": "2025-11-04T14:36:00Z"
      }
    }
  }
}
```

### Component Props (Conceptual)

```typescript
// response-card.md
interface ResponseCardProps {
  response: Response;
  showMarks: boolean;
  viewMode: 'compact' | 'grid' | 'detailed';
  onExpand: (responseId: string) => void;
  userRole: 'teacher' | 'student';
}

// response-card-expanded.md
interface ResponseCardExpandedProps {
  response: Response;
  expandedMarks: ('teacher' | 'self' | 'peer' | 'ai')[];
  showComparison: boolean;
  userRole: 'teacher' | 'student';
  onClose: () => void;
}

// ai-heatmap.md
interface AIHeatmapProps {
  sessionId: string;
  responses: Response[];
  rubric: Rubric;
  studentViewEnabled: boolean;
  currentUser: User;
}

// invite-banner.md
interface InviteBannerProps {
  sessionCode: string;
  sessionName: string;
  joinUrl: string;
  qrCodeUrl: string;
  joinCount: number;
  displayMode: 'compact' | 'card' | 'presentation';
}
```

---

## Related Documentation

- **Teacher Wireframes**: `../teacher/reveal-all-responses.md` (uses all components)
- **Student Wireframes**: `../student/responses-revealed.md` (uses response cards)
- **Navigation**: `../navbar.md` (links to analytics)
- **Main Overview**: `../wireframes.md` (high-level structure)

---

## Design Philosophy

These shared components embody key principles:

1. **Progressive Disclosure**: Start simple, reveal complexity on demand
   - Response cards show preview → Click for full → Click dots for detailed marks

2. **Consistency**: Same visual language across teacher and student views
   - Color coding (🔴🟢🔵🟣) never changes meaning
   - Layout patterns repeat

3. **Actionable Insights**: Don't just show data, suggest actions
   - Heatmap identifies struggling students → Recommend intervention
   - Mark comparison shows calibration → Suggest coaching

4. **Accessibility First**: Works for everyone
   - Color-blind friendly palettes
   - Keyboard navigation
   - Screen reader support

5. **Mobile-Ready**: Responsive from day one
   - Touch targets 44px minimum
   - Swipe gestures
   - Bottom sheets on mobile

---

## Future Enhancements

Potential additions to shared components:

- [ ] **rubric-editor.md**: Component for creating assessment criteria
- [ ] **peer-review-interface.md**: UI for students to review peer work
- [ ] **mark-comparison-widget.md**: Standalone comparison across mark types
- [ ] **concept-tag-selector.md**: UI for tagging responses with concepts
- [ ] **export-wizard.md**: Guided export with format/content selection
- [ ] **notification-toast.md**: Standardized notification system
- [ ] **progress-indicator.md**: Session stage progression UI

---

## Questions?

For implementation details or design decisions, refer to:
- Individual component documentation in this folder
- Main wireframes documentation: `../wireframes.md`
- Technical architecture: `../../../docs/technical-challenges.md`
