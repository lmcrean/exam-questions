# Response Card Component (Shared)

## Overview
Reusable card component displaying a student response preview with multi-source marking indicators. Used by both teachers and students in various views (submission list, voting stage, results, analytics).

## Card States
- **Compact View** (default): Preview with marks
- **Expanded View**: Full response with detailed marking breakdown

---

## Compact Response Card

```
┌────────────────────────────────────────────────────────────┐
│ 🐧 Dancing Penguin 42                  🔴 85 🟢 78 🔵 82 🟣 90 │
│                                                             │
│ The time complexity of this algorithm is O(n²) because     │
│ there are two nested loops. The outer loop iterates        │
│ through all n elements, and for each iteration of the...   │
│                                        [Show more ▼]        │
│                                                             │
│ 📎 2 images • 📊 842 words              Submitted 2m ago   │
└────────────────────────────────────────────────────────────┘
```

### Mark Indicators (Top-Right Corner)

**🔴 85** - Teacher Mark (out of 100)
**🟢 78** - Self-Assessment (student's own mark)
**🔵 82** - Peer Mark (average or aggregate)
**🟣 90** - AI Mark (automated assessment)

### Display Rules
- Show only marks that exist (hide dots if no mark given yet)
- Dots appear in fixed order: 🔴 🟢 🔵 🟣
- Number shows percentage or points (0-100 scale)
- Hover/tap shows label (e.g., "Teacher: 85/100")

---

## Card Variants

### 1. During Submission Stage (No Marks Yet)
```
┌────────────────────────────────────────────────────────────┐
│ 🐧 Dancing Penguin 42                                       │
│                                                             │
│ The time complexity of this algorithm is O(n²) because     │
│ there are two nested loops. The outer loop iterates        │
│ through all n elements, and for each iteration of the...   │
│                                        [Show more ▼]        │
│                                                             │
│ 📎 2 images • 📊 842 words              Submitted 2m ago   │
└────────────────────────────────────────────────────────────┘
```

### 2. After AI Assessment (Only AI Mark)
```
┌────────────────────────────────────────────────────────────┐
│ 🐧 Dancing Penguin 42                              🟣 90    │
│                                                             │
│ The time complexity of this algorithm is O(n²) because     │
│ there are two nested loops. The outer loop iterates        │
│ through all n elements, and for each iteration of the...   │
│                                        [Show more ▼]        │
│                                                             │
│ 📎 2 images • 📊 842 words              Submitted 2m ago   │
└────────────────────────────────────────────────────────────┘
```

### 3. After Self-Assessment Added
```
┌────────────────────────────────────────────────────────────┐
│ 🐧 Dancing Penguin 42                         🟢 78 🟣 90   │
│                                                             │
│ The time complexity of this algorithm is O(n²) because     │
│ there are two nested loops. The outer loop iterates        │
│ through all n elements, and for each iteration of the...   │
│                                        [Show more ▼]        │
│                                                             │
│ 📎 2 images • 📊 842 words              Submitted 2m ago   │
└────────────────────────────────────────────────────────────┘
```

### 4. After Peer Assessment Added
```
┌────────────────────────────────────────────────────────────┐
│ 🐧 Dancing Penguin 42                    🟢 78 🔵 82 🟣 90  │
│                                                             │
│ The time complexity of this algorithm is O(n²) because     │
│ there are two nested loops. The outer loop iterates        │
│ through all n elements, and for each iteration of the...   │
│                                        [Show more ▼]        │
│                                                             │
│ 📎 2 images • 📊 842 words              Submitted 2m ago   │
└────────────────────────────────────────────────────────────┘
```

### 5. Fully Marked (All Marks Present)
```
┌────────────────────────────────────────────────────────────┐
│ 🐧 Dancing Penguin 42                  🔴 85 🟢 78 🔵 82 🟣 90 │
│                                                             │
│ The time complexity of this algorithm is O(n²) because     │
│ there are two nested loops. The outer loop iterates        │
│ through all n elements, and for each iteration of the...   │
│                                        [Show more ▼]        │
│                                                             │
│ 📎 2 images • 📊 842 words              Submitted 2m ago   │
└────────────────────────────────────────────────────────────┘
```

---

## Grid View (Compact Cards)

```
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ 🐧 Penguin 42       │ │ 🦁 Lion 17          │ │ 🚀 Rocket 88        │
│        🔴 85 🟣 90  │ │   🟢 65 🔵 70 🟣 68 │ │           🟣 92     │
│                     │ │                     │ │                     │
│ The time complexity │ │ Looking at the      │ │ This is a quadratic │
│ of this algorithm...│ │ nested for loops... │ │ time complexity...  │
│                     │ │                     │ │                     │
│ 📎 2 🖼️ • 842 words │ │ 📎 0 • 1,203 words  │ │ 📎 3 🖼️ • 567 words │
│     [View]          │ │     [View]          │ │     [View]          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

---

## Card with Ranking Badge

```
┌────────────────────────────────────────────────────────────┐
│ 🥇 #1  🐧 Dancing Penguin 42           🔴 85 🟢 78 🔵 82 🟣 90 │
│                                                             │
│ The time complexity of this algorithm is O(n²) because     │
│ there are two nested loops. The outer loop iterates        │
│ through all n elements, and for each iteration of the...   │
│                                        [Show more ▼]        │
│                                                             │
│ 📎 2 images • 📊 842 words • 🏆 15 votes                    │
└────────────────────────────────────────────────────────────┘
```

---

## Interactive States

### Hover State
```
┌────────────────────────────────────────────────────────────┐
│ 🐧 Dancing Penguin 42                  🔴 85 🟢 78 🔵 82 🟣 90 │
│                                        ┌──────────────────┐│
│ The time complexity of this algorithm  │ Teacher: 85/100  ││
│ there are two nested loops. The outer  │ Self: 78/100     ││
│ through all n elements, and for each...│ Peer: 82/100     ││
│                                        │ AI: 90/100       ││
│                                        └──────────────────┘│
│ 📎 2 images • 📊 842 words              Submitted 2m ago   │
└────────────────────────────────────────────────────────────┘
```

### Selected State (for comparison/analysis)
```
┌────────────────────────────────────────────────────────────┐
│ ✓ 🐧 Dancing Penguin 42                🔴 85 🟢 78 🔵 82 🟣 90 │
│ ┃                                                           │
│ ┃ The time complexity of this algorithm is O(n²) because   │
│ ┃ there are two nested loops. The outer loop iterates      │
│ ┃ through all n elements, and for each iteration of the... │
│ ┃                                      [Show more ▼]       │
│ ┃                                                           │
│ ┃ 📎 2 images • 📊 842 words            Submitted 2m ago   │
└────────────────────────────────────────────────────────────┘
```

---

## Mobile Responsive

```
┌─────────────────────────────┐
│ 🐧 Penguin 42               │
│           🔴 85 🟢 78 🟣 90 │
│                             │
│ The time complexity of      │
│ this algorithm is O(n²)     │
│ because there are two...    │
│         [Show more]         │
│                             │
│ 📎 2 • 842w • 2m ago        │
└─────────────────────────────┘
```

---

## Mark Legend (Shown in UI)

```
┌────────────────────────────────────────┐
│ 🔴 Teacher  🟢 Self  🔵 Peer  🟣 AI    │
└────────────────────────────────────────┘
```

Or as a collapsible help section:
```
┌────────────────────────────────────────────────────────────┐
│ Mark Colors   [?]                                          │
│ ┌────────────────────────────────────────────────────────┐│
│ │ 🔴 Teacher Mark - Official grade from instructor       ││
│ │ 🟢 Self-Assessment - Student's own evaluation          ││
│ │ 🔵 Peer Mark - Average from classmate reviews          ││
│ │ 🟣 AI Mark - Automated assessment using rubric         ││
│ └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

---

## Features

### Display Logic
- **Progressive disclosure**: Marks appear as they're added
- **Color coding**: Consistent across all views
- **Accessibility**: Tooltip labels for screen readers
- **Responsive**: Adapts to screen size

### Interaction
- **Click card**: Open expanded view
- **Hover dots**: Show mark labels
- **Click dots**: Jump to marking details in expanded view
- **Select checkbox**: Add to comparison set (teacher view)

### Context-Aware
- **Student View**:
  - Always see own self-assessment (🟢)
  - May see peer marks if enabled (🔵)
  - May see AI marks if teacher reveals (🟣)
  - See teacher mark after release (🔴)

- **Teacher View**:
  - Always see all marks
  - Can toggle mark visibility for students
  - Can compare mark discrepancies

---

## Usage Examples

### In Submission Stage
- No marks shown
- Focus on response content preview

### In Review/Voting Stage
- May show AI marks if auto-assessment enabled
- Students reviewing without bias from grades

### In Results Stage
- Show voting points/ranking
- May start showing marks if assessment workflow begins

### In Assessment Stage
- All applicable marks visible
- Teacher can identify discrepancies
- Students see feedback on their self-assessment accuracy

---

## Technical Notes

### Mark Data Structure
```json
{
  "responseId": "resp_123",
  "studentId": "Dancing Penguin 42",
  "marks": {
    "teacher": { "score": 85, "max": 100, "timestamp": "2025-11-04T14:32:00Z" },
    "self": { "score": 78, "max": 100, "timestamp": "2025-11-04T14:28:00Z" },
    "peer": { "score": 82, "max": 100, "count": 5, "timestamp": "2025-11-04T14:35:00Z" },
    "ai": { "score": 90, "max": 100, "timestamp": "2025-11-04T14:26:00Z" }
  }
}
```

### Styling Tokens
```
Color definitions:
--mark-teacher: #EF4444 (red-500)
--mark-self: #10B981 (green-500)
--mark-peer: #3B82F6 (blue-500)
--mark-ai: #A855F7 (purple-500)
```

---

## Related Components
- `response-card-expanded.md` - Full detailed view
- `ai-heatmap.md` - Analytics visualization
- `mark-comparison-view.md` - Side-by-side mark analysis
