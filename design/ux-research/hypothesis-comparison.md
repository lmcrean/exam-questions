# Hypothesis Comparison: Which Pain Point to Solve First?

## ⚠️ Disclaimer

**This document contains hypothetical scenarios and opinions for educational and product development purposes only.**

- All scenarios, examples, and challenges described are entirely hypothetical and not based on any specific school or institution
- This document does not represent the views, experiences, or practices of any employer, school, or educational institution
- Information is based on publicly available research about UK secondary education in general
- No individual school, student, colleague, or workplace is being referenced or described
- This is personal research for product development, not professional advice

---

## Executive Summary

**The Dilemma:**
Three hypotheses all lead to a similar technical product (student submission → AI analysis → display/feedback), but differ in positioning and priority:

- **Hypothesis 1:** Live pattern-spotting for formative exam practice (Mentimeter alternative)
- **Hypothesis 2:** Bulk marking automation for summative assessments (data drops, Google Classroom extension with added automation)
- **Hypothesis 3:** All-in-one flexible assessment platform (better Mentimeter + AI marking in one tool)

**Initial Assessment:**
Hypothesis 2 (marking workflow) represents the bigger, more urgent pain point, but Hypothesis 1 (Mentimeter-style starters) offers better engagement and retention. Hypothesis 3 combines both by positioning as "one tool for all assessment types."

**Key Questions:**
1. Should we build primarily for data drops (H2) and add starters (H1) as secondary?
2. Or build a unified "one tool" platform (H3) that handles both seamlessly from the start?
3. Is "one tool for everything" compelling enough to overcome switching costs from specialized tools?

---

## Three-Way Hypothesis Comparison

| Dimension | H1: Pattern-Spotting | H2: AI Marking | H3: All-in-One Platform |
|-----------|---------------------|----------------|------------------------|
| **Positioning** | "Better Mentimeter for exam questions" | "AI marking assistant for data drops" | "One tool for all assessment types" |
| **Primary Pain** | Can't spot patterns in 30 student responses | 55+ hours marking 330 students | Tool fragmentation + both pains (H1+H2) |
| **Primary User** | Both teacher and students | Primarily teacher | Teacher (both workflows) |
| **Frequency** | Weekly (or more) | Termly (3-4 times/year) | Daily (starters) + Termly (marking) |
| **Time Constraint** | 20-30 min lesson, 5-10 min review | Days/weeks of marking | Both |
| **Stakes** | Low (formative assessment) | High (official grades) | Both low and high stakes |
| **User Value** | Peer learning, engagement, quick insights | Time savings, work-life balance | "One login" + both H1 and H2 benefits |
| **Pain Intensity** | Moderate (workaround: paper works okay) | Severe (staying until 6pm, burnout) | Combination of both |
| **Willingness to Pay** | Low (paper is free) | High (time = money) | Moderate-High ("replaces 3 tools") |
| **Differentiation** | vs. Mentimeter (no char limits) | vs. manual marking (80% time savings) | vs. fragmented tools (Mentimeter + GC + marking) |
| **Tech Complexity** | Moderate (real-time, voting, display) | High (AI accuracy, rubric integration) | High (both workflows + flexibility) |
| **Trust Threshold** | Low (errors are low-stakes) | High (must trust for official grades) | Variable (low for starters, high for marking) |
| **Validation Ease** | Easy (run 2-3 lessons, immediate feedback) | Harder (need real coursework, check accuracy) | Harder (must validate BOTH workflows + "one tool" value prop) |
| **Unique Feature** | Live display, voting, peer review | AI marking, grade export, teacher review | **Flexibility:** decide to grade *after* submission |
| **Risk** | Low pain intensity → low retention | Low frequency → seasonal usage | Jack of all trades, master of none? |
| **Opportunity** | Daily use → habit formation | High pain → high willingness to pay | Daily use + high pain = best of both |

---

## Core Insight: Same Product, Different Entry Points

**The Realization:**
These aren't two different products—they're **two use cases for the same platform**:

1. **Student submission system** (shared)
2. **AI analysis against mark scheme** (shared)
3. **Display mode:** Live board view (H1) vs. Teacher review interface (H2)
4. **Feedback mode:** Peer voting + discussion (H1) vs. Instant individual feedback (H2)
5. **Grading mode:** Optional (H1) vs. Required for data drops (H2)

**Implication:**
You don't have to choose one hypothesis over the other—you can **build the core platform once** and support both workflows with different UI/UX paths.

---

## Architecture: One Platform, Two Workflows

### Core Platform (Shared)
```
Student Submission
    ↓
AI Analysis (against mark scheme)
    ↓
[Branch: Use Case]
```

### Workflow A: Live Formative (Hypothesis 1)
```
AI Analysis
    ↓
Live Display (all responses on board)
    ↓
Peer Review / Voting
    ↓
Class Discussion (teacher-led)
    ↓
[Optional] AI Heatmap for Teacher
```

**Setup:**
- Teacher creates question with mark scheme
- Display mode: On (responses shown live)
- Voting: Enabled
- Grading: Optional

**Use Case:** Starters, exam practice, quick checks for understanding

---

### Workflow B: Async Summative (Hypothesis 2)
```
AI Analysis
    ↓
Instant Feedback to Students
    ↓
Teacher Review Interface (adjust grades)
    ↓
Export Grades for Data Drop
    ↓
[Optional] Students see peer responses
```

**Setup:**
- Teacher creates assignment with detailed rubric
- Display mode: Off (responses private by default)
- Voting: Disabled
- Grading: Required
- Self/peer assessment: Optional

**Use Case:** Coursework, data drops, high-stakes assessment

---

## Which Pain Point is Stronger?

### Hypothesis 1: Pattern-Spotting (Live Formative)

**Pros:**
- ✅ **Frequent use case** (weekly or more) → higher retention
- ✅ **Low stakes** → easier to validate (run test tomorrow)
- ✅ **Dual value prop** → teacher (pattern-spotting) + student (engagement)
- ✅ **Clear differentiation** → "Mentimeter but for exam questions"
- ✅ **Fun factor** → students enjoy seeing peer responses, voting
- ✅ **Viral potential** → students ask "can we do this again?"

**Cons:**
- ❌ **Weaker pain point** → paper works okay, not urgent
- ❌ **Low willingness to pay** → competing with free (paper + verbal)
- ❌ **Not a hair-on-fire problem** → teachers survive without this
- ❌ **Nice-to-have** → improves engagement but doesn't solve critical workload issue

**Pain Score: 4/10**
- Teachers want this, but don't *need* it urgently

---

### Hypothesis 2: AI Marking (Summative Assessment)

**Pros:**
- ✅ **Severe pain point** → 55+ hours, evening/weekend work, burnout
- ✅ **Clear ROI** → saves 45+ hours per term (time = money)
- ✅ **High willingness to pay** → if it works, worth paying for
- ✅ **Hair-on-fire problem** → data drops cause genuine stress
- ✅ **Institutional value** → schools might pay (not just individual teachers)

**Cons:**
- ❌ **Less frequent** → 3-4 times/year (lower retention risk)
- ❌ **High stakes** → must be accurate (high trust threshold)
- ❌ **Harder to validate** → need real coursework, accurate AI, full workflow
- ❌ **Complex workflow** → rubrics, consistency, review process
- ❌ **AI risk** → if accuracy is poor, product fails completely

**Pain Score: 9/10**
- Teachers need this desperately, but will it work?

---

## The "Why Not Google Classroom?" Question

**Common Question:**
"Why not just use Google Classroom for submissions and mark manually? It's relatively quick, just without auto-assigned grades."

**Analysis:**

### What Google Classroom Does Well:
- ✅ Centralized submission (no lost work)
- ✅ Can mark anywhere (not tied to physical location)
- ✅ Grading interface exists
- ✅ Export grades

### What Google Classroom Doesn't Solve:
- ❌ **Time burden unchanged:** Still 55+ hours to mark 330 students manually
- ❌ **No AI assistance:** Every response must be read by human
- ❌ **No instant feedback:** Students wait 1-2 weeks (you're still manually marking)
- ❌ **No pattern-spotting:** Still reading 330 responses sequentially
- ❌ **No peer learning:** Responses are private (can't see peers)
- ❌ **No consistency support:** Teacher must maintain standards manually across days

### Product Differentiation:
1. **AI first-pass marking** → Teacher reviews in 1/10th the time
2. **Instant student feedback** → WWW/EBI within minutes of submission
3. **Pattern analysis** → AI highlights common mistakes (don't read all 330)
4. **Peer visibility** (optional) → Students learn from each other
5. **Dynamic workflow** → Can set marking criteria *after* submission

**Insight:**
Google Classroom is a *submission system*. This product is a **marking assistant + formative feedback engine**. They're complementary, not competitors. (Google Classroom integration for submissions could be beneficial.)

---

## The Hybrid Approach: "Flexible Assessment Platform"

### Product Vision:
**"The only assessment tool you need—from quick starters to data drop coursework."**

### Positioning:
- **Core:** AI-powered marking and feedback engine
- **Mode 1:** Live formative (Mentimeter replacement)
- **Mode 2:** Async summative (data drop assistant)
- **Flexibility:** Teacher chooses workflow per assignment

---

## Feature Matrix: Core → Workflow-Specific

| Feature | Priority | Workflow A (Live) | Workflow B (Async) |
|---------|----------|-------------------|-------------------|
| **Student submission** | Core | ✅ Required | ✅ Required |
| **Mark scheme integration** | Core | ✅ Required | ✅ Required |
| **AI analysis** | Core | ✅ Required | ✅ Required |
| **Live display (board view)** | Mode-specific | ✅ Required | ⚪ Optional |
| **Voting/peer review** | Mode-specific | ✅ Required | ⚪ Optional |
| **Individual feedback** | Mode-specific | ⚪ Optional | ✅ Required |
| **Teacher review interface** | Mode-specific | ⚪ Optional | ✅ Required |
| **Grade export** | Mode-specific | ❌ Not needed | ✅ Required |
| **Self-assessment** | Enhancement | ⚪ Optional | ⚪ Optional |
| **File upload** | Enhancement | ⚪ Optional (text first) | ✅ Required |
| **Analytics/heatmaps** | Enhancement | ⚪ Nice-to-have | ⚪ Nice-to-have |

**Legend:**
- ✅ Required for this workflow
- ⚪ Optional (add later)
- ❌ Not applicable

---

## Recommended Build Strategy

### Option A: Start with High-Stakes (Hypothesis 2 First)

**Rationale:**
- Solve the **bigger pain** (55+ hours → 10 hours)
- Higher **willingness to pay** (time savings = clear ROI)
- If AI marking works for high-stakes, it definitely works for low-stakes

**MVP Scope (4-6 weeks):**
1. Student submission (text input, simple rubric)
2. AI marking with WWW/EBI feedback
3. Teacher review interface (quick grade adjustment)
4. Grade export (CSV)
5. **Test with:** One data drop assessment (30-90 students)

**Then Add Workflow A (Mentimeter Mode):**
6. Live display mode (show all responses on board)
7. Voting/peer review features
8. **Test with:** Weekly starters

**Pros:**
- ✅ Solves urgent pain first
- ✅ Validates AI accuracy early (high-stakes = high bar)
- ✅ Clear success metric (time saved)

**Cons:**
- ❌ Harder to validate (need full marking workflow)
- ❌ Longer time to first test (4-6 weeks vs. 1 week)

---

### Option B: Start with Engagement (Hypothesis 1 First)

**Rationale:**
- **Faster validation** (run test in 1 week with Wooclap)
- **Frequent use** → establish habit, then upsell to marking features
- **Lower stakes** → easier to experiment with AI

**MVP Scope (2-3 weeks):**
1. Student submission (text input)
2. Live display (all responses on board)
3. Voting/peer review
4. **Test with:** 2-3 lessons of exam practice

**Then Add Workflow B (Marking Mode):**
5. AI marking with feedback
6. Teacher review interface
7. Grade export
8. **Test with:** One data drop assessment

**Pros:**
- ✅ Faster validation (test tomorrow with Wooclap wizard)
- ✅ Frequent use builds retention
- ✅ Fun factor → students want to use it

**Cons:**
- ❌ Delays solving the bigger pain (marking workload)
- ❌ Lower willingness to pay (competing with free paper)
- ❌ Risk: Build engagement tool, never validate marking workflow

---

### Option C: Hybrid MVP (Recommended)

**Rationale:**
Build the **minimal core** that supports both workflows, validate both simultaneously.

**MVP Scope (3-4 weeks):**

**Core (shared by both workflows):**
1. Student submission (text input)
2. Basic mark scheme (5 categories, 1-5 scale)
3. AI analysis (grade + WWW/EBI feedback)

**Workflow A: Live mode** (2 days extra)
4. Display all responses (simple list view)
5. [Skip voting initially—just display]

**Workflow B: Marking mode** (1 week extra)
6. Teacher review interface (see all grades, adjust quickly)
7. Grade export (CSV)

**Validation Plan:**
- **Week 1:** Test Workflow A (live formative) with 2-3 lessons
- **Week 2:** Test Workflow B (marking) with one coursework assignment (30 students)
- **Week 3:** Decide which workflow has stronger validation → prioritize accordingly

**Pros:**
- ✅ Validates both use cases before committing
- ✅ Learns which pain point is stronger *empirically*
- ✅ Flexible: can pivot based on test results

**Cons:**
- ⚪ Slightly longer MVP (3-4 weeks vs. 2-3 weeks)
- ⚪ Slightly more scope (two UI paths)

---

### Option D: All-in-One Platform (Hypothesis 3)

**Rationale:**
Position from day one as **"one tool for all assessment types"**—not just two workflows, but a unified platform philosophy with unique flexibility features.

**MVP Scope (4-5 weeks):**

**Core platform (shared):**
1. Student submission (text + file upload)
2. Flexible mark scheme builder (can be added/edited after submission)
3. AI analysis engine

**Workflow A: Formative starters**
4. Live display mode (all responses on board)
5. Voting/peer review (optional)

**Workflow B: Summative marking**
6. Teacher review interface (bulk grade adjustment)
7. Grade export (CSV)
8. Individual student feedback delivery

**Unique to H3: Flexibility features**
9. **"Decide later" grading:** Teacher can add rubric and grade *after* students submit
10. **Escalation:** One-click to turn starter into graded assessment
11. **Unified student view:** All their work (starters + assignments) in one place

**Validation Plan:**
- **Week 1:** Test starters (formative) with 2-3 lessons
- **Week 2:** Test marking (summative) with one coursework assignment
- **Week 3:** Test "decide later" flexibility feature (start as starter, grade retroactively)
- **Week 4:** Interview teachers: "Do you value 'one tool' over specialized tools?"

**Pros:**
- ✅ Validates complete value prop (not just workflows, but "one tool" positioning)
- ✅ Tests unique differentiator (flexibility to decide after submission)
- ✅ Combines best of both: daily use (H1) + big pain solved (H2)
- ✅ Strong positioning: "replaces 3 tools" (Mentimeter + GC + manual marking)
- ✅ If validated, builds loyal users (daily touchpoints + termly high-value)

**Cons:**
- ❌ Most complex to build (both workflows + flexibility features)
- ❌ Longest validation time (must test BOTH workflows + flexibility)
- ❌ Highest risk: "jack of all trades, master of none"
- ❌ Must validate 3 hypotheses: (1) better than Mentimeter, (2) saves marking time, (3) "one tool" is compelling

**Critical Success Factor:**
Teachers must use it for **BOTH** starters AND marking. If only used for one workflow, it's not Hypothesis 3—it's H1 or H2 in disguise.

**Decision point after validation:**
- If "one tool" resonates strongly → Continue with H3 positioning
- If teachers prefer specialized tools → Pivot to H1 or H2 (separate products)
- If flexibility features unused → Simplify to Option C (two separate workflows in one platform, no dynamic features)

---

## Decision Framework: Three-Way Prioritization Matrix

| Criterion | Weight | Hypothesis 1 (Live) | Hypothesis 2 (Marking) | Winner |
|-----------|--------|-------------------|----------------------|--------|
| **Pain intensity** | 25% | 4/10 | 9/10 | H2 |
| **Frequency of use** | 20% | 9/10 (weekly) | 4/10 (termly) | H1 |
| **Willingness to pay** | 20% | 3/10 | 8/10 | H2 |
| **Validation ease** | 15% | 9/10 (test tomorrow) | 5/10 (need real coursework) | H1 |
| **Differentiation** | 10% | 7/10 (better Mentimeter) | 8/10 (AI marking) | H2 |
| **Trust threshold** | 10% | 3/10 (low stakes) | 9/10 (high stakes) | H1 |

**Weighted Score:**
- **Hypothesis 1:** (4×0.25) + (9×0.20) + (3×0.20) + (9×0.15) + (7×0.10) + (3×0.10) = **5.45**
- **Hypothesis 2:** (9×0.25) + (4×0.20) + (8×0.20) + (5×0.15) + (8×0.10) + (9×0.10) = **6.95**

**Result: Hypothesis 2 (Marking) wins on weighted criteria**

But don't ignore Hypothesis 1—it's a **retention driver** (frequent use) and **engagement hook** (students enjoy it).

---

## Google Classroom Comparison

**Common Question:**
"Why not just use Google Classroom for submissions and mark manually?"

**Answer: This product solves a different problem.**

### Google Classroom Workflow:
1. Students upload → 2. Teacher marks manually (55 hours) → 3. Grades recorded → 4. Feedback given (1-2 weeks later)

**Pain:** Still 55 hours of manual marking

### This Product (Hypothesis 2) Workflow:
1. Students upload → 2. **AI marks in 5 minutes** → 3. Teacher reviews (2-4 hours) → 4. Feedback instant

**Value:** 80%+ time savings, instant feedback

### This Product (Hypothesis 1) Workflow:
1. Students submit → 2. **Live display on board** → 3. Peer review/voting → 4. Class discussion

**Value:** Pattern-spotting, peer learning, engagement (impossible with Google Classroom)

**Conclusion:**
Google Classroom is a **submission tool**. This product is a **marking + feedback + engagement tool**. They're not competing—they're complementary. (Consider Google Classroom integration for submissions!)

---

## What Makes This Product Different from Manual Marking?

| Feature | Manual (Google Classroom) | This Product |
|---------|--------------------------|--------------|
| **Submission** | ✅ Easy | ✅ Easy (or integrate with GC) |
| **Marking time** | 55 hours (330 students) | 4-10 hours (AI + teacher review) |
| **Feedback speed** | 1-2 weeks | Instant (AI feedback within minutes) |
| **Consistency** | Variable (drift over days) | Consistent (AI applies rubric uniformly) |
| **Pattern-spotting** | Manual (read all 330) | AI heatmap (instant class insights) |
| **Peer learning** | Not possible (private) | Optional (see peer responses) |
| **Self-assessment** | Manual (separate form) | Integrated workflow |
| **Dynamic rubrics** | Must set upfront | Can adjust criteria after submission |
| **Auto-grading** | ❌ No | ✅ Yes (with teacher review) |

**Product Differentiation:**
"**The marking assistant that saves 45+ hours per data drop while giving students instant feedback.**"

---

## Recommended Strategy: "Data Drop First, Starters Second"

### Phase 1: Validate Hypothesis 2 (Core Pain)
**Goal:** Prove AI can save 80% of marking time with 85%+ accuracy

**Build (4-6 weeks):**
1. Student submission (text + file upload)
2. AI marking against rubric
3. Teacher review interface
4. Grade export
5. **Flexibility feature:** Teacher can adjust rubric after submissions

**Test with:**
- 1 coursework assignment (30-90 students)
- Measure: Time saved, AI accuracy, teacher trust

**Success criteria:**
- ✅ 80%+ time savings
- ✅ 85%+ grade accuracy
- ✅ Teacher would use for real data drop

---

### Phase 2: Add Hypothesis 1 Features (Engagement Layer)
**Goal:** Add Mentimeter-style workflow for frequent formative use

**Add (2-3 weeks):**
6. Live display mode (toggle: on/off)
7. Voting/peer review
8. Simplified starter workflow (skip file upload, quick text submission)

**Test with:**
- 3-5 lessons (starters, quick checks)
- Measure: Student engagement, teacher pattern-spotting speed

**Success criteria:**
- ✅ Used weekly (not just novelty)
- ✅ Students ask "can we do this again?"
- ✅ Teacher spots patterns faster than paper

---

### Phase 3: The Full Platform
**Positioning:** "One tool for all assessment—from starters to data drops"

**Modes:**
- **Quick Check (H1):** Live display, voting, pattern-spotting (5-15 min)
- **Formative Assessment (H1+H2):** Instant feedback, optional peer review (1 lesson)
- **Summative Assessment (H2):** AI marking, teacher review, grade export (coursework/data drops)

**Pricing:**
- Free tier: Quick checks (H1) only
- Premium: Full marking workflow (H2) + analytics

---

## Final Recommendation

### Build Order:
1. **Core:** Student submission + AI marking (shared foundation)
2. **Hypothesis 2 first:** Teacher review interface, grade export (solve biggest pain)
3. **Hypothesis 1 second:** Live display, voting (add engagement + retention)
4. **Optional features:** Self/peer assessment, advanced analytics (iterate based on feedback)

### Rationale:
- **Hypothesis 2** is the **hair-on-fire problem** (55+ hours marking)
- **Hypothesis 1** is the **retention driver** (weekly use, student engagement)
- Building H2 first validates AI accuracy (high bar) → if it works for high-stakes, it works for low-stakes
- Adding H1 second creates **frequent touchpoints** (weekly starters) to retain users between data drops

---

## Key Questions to Resolve

Before committing to build, validate:

1. **Can AI realistically achieve 85%+ accuracy on open-ended coursework?**
   - Test: Manually mark 30 sample submissions, then ask Claude to mark same submissions
   - Compare: How often do AI grades match yours?

2. **Is 80% time savings realistic?**
   - Test: Time yourself reviewing 30 AI-graded submissions vs. marking 30 from scratch
   - Calculate: Does review + setup < 20% of manual marking time?

3. **Will teachers trust AI grades for official data drops?**
   - Test: Show 3 teachers AI-graded work (with your review)
   - Ask: "Would you submit these grades to leadership?"

4. **Do students act on instant AI feedback?**
   - Test: Give 30 students AI feedback immediately
   - Measure: How many revise their work? Does next assignment improve?

5. **Does peer review add value or just friction?**
   - Test: Run one session with peer review, one without
   - Compare: Learning outcomes, student engagement, time taken

---

## Success Metrics (90 Days Post-Launch)

### Hypothesis 2 (Core Value):
- ✅ 10+ teachers use for at least one data drop
- ✅ Average time savings: 70%+ (validated by survey)
- ✅ 80%+ would use again next term
- ✅ 0 reports of "grades were inaccurate"

### Hypothesis 1 (Retention):
- ✅ 50%+ of users try live mode at least once
- ✅ 30%+ of users use live mode weekly
- ✅ Student NPS > 50 ("would recommend to a friend")

### Platform Health:
- ✅ 100+ total assignments created
- ✅ 3,000+ student submissions processed
- ✅ Teacher retention: 60%+ active after 90 days

---

## Conclusion: A Clear Path Forward

**Primary Target:** Hypothesis 2 (Data Drop Marking Workflow)
- Solve the **biggest pain** (55+ hours → <10 hours)
- Prove **AI accuracy** and **time savings**
- Position as "marking assistant for data drops"

**Secondary Feature:** Hypothesis 1 (Mentimeter-Style Starters)
- Add **engagement** and **frequent use** (weekly touchpoints)
- Drive **retention** between data drops
- Position as "also great for quick formative checks"

**Product Vision:**
"**The flexible assessment platform that saves you 45+ hours per data drop—and works beautifully for daily starters too.**"

**Next Steps:**
1. ✅ Validate AI marking accuracy (test with 30 sample submissions)
2. ✅ Prototype teacher review interface (wireframe/Figma)
3. ⏳ Build minimal Hypothesis 2 MVP (4-6 weeks)
4. ⏳ Test with 1 data drop (30-90 students)
5. ⏳ If successful: Add Hypothesis 1 features (2-3 weeks)
6. ⏳ Test with 3-5 lessons (starters)
7. ⏳ Decide: Full build or pivot based on validation
