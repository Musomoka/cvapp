import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

/**
 * Extract text from uploaded files (PDF, DOCX, TXT)
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
        return await extractTextFromTXT(filePath);
      
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    throw new Error(`Failed to extract text from ${ext} file: ${error.message}`);
  }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractTextFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

/**
 * Extract text from TXT file
 */
async function extractTextFromTXT(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}
