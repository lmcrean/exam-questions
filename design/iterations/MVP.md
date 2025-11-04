MVP plan

**Legal Disclaimer: all statements below are hypothetical scenarios performed for product research, they do not reflect the actions of any individual or institution.**

# Iteration 1: Localhost extension to Google Classroom

1. Collect student work on GC
2. Bulk download -- this is possible
3. Clean data of names 
4. Add docx/PDFs to Repo in .gitignore
5. Bulk upload to [this app] via docx, images, PDFs.
6. Set Rubric, AI Assess draft.
7. Output as CSV table. User Reviews.

## Rationale

- prioritise pain point of hypothesis 2: Google Classroom does not offer AI drafted marking.
- do not start hypothesis 1 -- 80% of pain can be addressed with wooclap
- do not take on hypothesis 3
- localhost only (full control of safety challenges)
- Google Classroom, prevents any private data (safety challenges)

## iteration 1 challenges

*legal/safety*: 
Q: how can student PII be protected? For data drop, teacher at least needs to see first name.
A: Onus on teacher to clean sensitive data before sending to AI.
A: No longterm storage: mark-review-download-clean data after 3 days, files are kept on localstorage, never saved online.
A: make this a localhost application

*technical challenges*: 
Q: how can docx, images/ PDFs be formatted for on-screen rendering and AI reading? 
A: no images

Q: Is there a conversion? How will AI read a docx?
A: **Gemini API does NOT support DOCX directly** - only PDF and plain text are supported.
   - Pipeline must include server-side DOCX-to-PDF converter
   - Conversion happens before sending to Gemini API
   - Options: LibreOffice (headless), python-docx + reportlab, or docx2pdf library
   - User uploads DOCX → server converts to PDF → AI processes PDF


## Future iterations

Order undecided:

- rendering of docx in UI for smooth marking workflow
- image upload with OCR
- multi-auth -- product becomes shareable with other teachers.
- MFA -- improved security
- Saving data
- AI Heatmap actionable insights (hypothesis 1)
- MentiMeter interface (i.e. remove Google Classroom from the MVP workflow) consider costs of losing familiar interface
- Student/Peer Review feature (also not available on Google Classroom)
