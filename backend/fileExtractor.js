import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

/**
 * Normalise extracted text:
 *  - strip non-printable / control characters
 *  - collapse runs of spaces/tabs to a single space
 *  - collapse 3+ consecutive blank lines to 2
 *  - strip leading whitespace from every line
 */
function cleanText(raw) {
  return raw
    // keep printable ASCII + common Unicode; remove control chars except tab/LF/CR
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\uFFFF]/g, ' ')
    .replace(/[ \t]+/g, ' ')          // collapse spaces/tabs on a line
    .replace(/^[ \t]+/gm, '')         // trim leading whitespace per line
    .replace(/\n{3,}/g, '\n\n')       // max two consecutive blank lines
    .trim();
}

/**
 * Extract text from uploaded files (PDF, DOCX, TXT).
 * Returns cleaned text ready to be sent to the AI.
 */
export async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    switch (ext) {
      case '.pdf':
        return await extractTextFromPDF(filePath);
      
      case '.docx':
        return await extractTextFromDOCX(filePath);
      
      case '.txt':
        return extractTextFromTXT(filePath);
      
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    // Re-throw with context if not already a user-facing message
    throw error;
  }
}

/**
 * Extract text from a text-based PDF.
 * Throws a clear error if the PDF appears to be image/scan-based.
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);

  const numPages = data.numpages || 1;
  const rawText = data.text || '';

  // Count non-whitespace characters to judge text density
  const nonWhitespaceChars = rawText.replace(/\s/g, '').length;
  const charsPerPage = nonWhitespaceChars / numPages;

  if (charsPerPage < 50) {
    throw new Error(
      'This PDF appears to be a scanned or image-based document and contains no selectable text. ' +
      'Please use a text-based PDF, or save your CV as a .docx or .txt file instead.'
    );
  }

  return cleanText(rawText);
}

/**
 * Extract text from a DOCX file.
 */
async function extractTextFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return cleanText(result.value);
}

/**
 * Extract text from a plain-text file — fastest path, no parsing needed.
 */
function extractTextFromTXT(filePath) {
  return cleanText(fs.readFileSync(filePath, 'utf-8'));
}
