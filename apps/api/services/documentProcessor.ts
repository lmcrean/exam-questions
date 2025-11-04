/**
 * Document Processor Service
 *
 * Handles conversion of various document formats for AI processing.
 * Currently supports DOCX to PDF conversion using Python script.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Converts a DOCX file to PDF format
 *
 * @param docxPath - Absolute path to the DOCX file
 * @returns Promise<string> - Absolute path to the generated PDF file
 * @throws Error if conversion fails or file doesn't exist
 */
export async function convertDocxToPdf(docxPath: string): Promise<string> {
  // Validate input file exists
  try {
    await fs.access(docxPath);
  } catch (error) {
    throw new Error(`DOCX file not found: ${docxPath}`);
  }

  // Validate file extension
  if (!docxPath.toLowerCase().endsWith('.docx')) {
    throw new Error(`Invalid file type. Expected .docx, got: ${path.extname(docxPath)}`);
  }

  // Construct path to Python converter script (in apps/ai/scripts/)
  const converterPath = path.resolve(
    __dirname,
    '../../../ai/scripts/convert-docx-to-pdf.py'
  );

  // Expected output path (same location as input, .pdf extension)
  const pdfPath = docxPath.replace(/\.docx$/i, '.pdf');

  try {
    console.log(`[Document Processor] Converting DOCX to PDF: ${path.basename(docxPath)}`);

    // Execute Python conversion script
    const { stdout, stderr } = await execAsync(
      `python "${converterPath}" "${docxPath}"`
    );

    if (stderr && !stderr.includes('Warning')) {
      console.error(`[Document Processor] Conversion warning: ${stderr}`);
    }

    // Verify PDF was created
    await fs.access(pdfPath);

    console.log(`[Document Processor] Conversion successful: ${path.basename(pdfPath)}`);

    return pdfPath;
  } catch (error) {
    throw new Error(
      `DOCX to PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Determines if a file needs conversion before AI processing
 *
 * @param filePath - Path to the file
 * @returns true if file needs conversion (e.g., DOCX), false otherwise
 */
export function needsConversion(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.docx';
}

/**
 * Processes a document for AI consumption
 * Converts to PDF if needed, or returns original path
 *
 * @param filePath - Path to the document
 * @returns Promise<string> - Path to AI-ready file (PDF or original)
 */
export async function prepareForAI(filePath: string): Promise<string> {
  if (needsConversion(filePath)) {
    return await convertDocxToPdf(filePath);
  }

  // Already in AI-compatible format (PDF, plain text, etc.)
  return filePath;
}
