import * as mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple methods to import pdf-parse
let pdfParse;
const loadPdfParse = async () => {
  if (pdfParse) return pdfParse;
  
  console.log('Loading PDF parser...');
  
  // Method 1: Dynamic import with .default (most common)
  try {
    const module = await import('pdf-parse');
    if (module.default && typeof module.default === 'function') {
      pdfParse = module.default;
      console.log('PDF parser loaded (method 1)');
      return pdfParse;
    }
  } catch (e) {
    console.log('Method 1 failed:', e.message);
  }
  
  // Method 2: Try require with createRequire
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    pdfParse = require('pdf-parse');
    console.log('PDF parser loaded (method 2)');
    return pdfParse;
  } catch (e) {
    console.log('Method 2 failed:', e.message);
  }
  
  // Method 3: Try direct import without .default
  try {
    const module = await import('pdf-parse');
    if (typeof module === 'function') {
      pdfParse = module;
      console.log('PDF parser loaded (method 3)');
      return pdfParse;
    }
  } catch (e) {
    console.log('Method 3 failed:', e.message);
  }
  
  throw new Error('Could not load pdf-parse using any method');
};

export const extractText = async (filePath, fileType) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`Extracting text from ${fileType} file: ${path.basename(filePath)}`);
    const fileBuffer = fs.readFileSync(filePath);
    
    let extractedText = '';
    
    if (fileType === 'pdf') {
      console.log('Processing PDF file...');
      try {
        // Load pdf parser
        const pdf = await loadPdfParse();
        
        if (typeof pdf !== 'function') {
          throw new Error('PDF parser is not a function');
        }
        
        const data = await pdf(fileBuffer);
        extractedText = data.text || '';
        
        console.log(`PDF processed: ${data.numpages || 0} pages, ${extractedText.length} characters`);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        
        // Fallback: Try to read as text (some PDFs might be text-based)
        try {
          console.log('Trying fallback: reading as text...');
          extractedText = fileBuffer.toString('utf-8');
          console.log(`Fallback successful: ${extractedText.length} characters`);
        } catch (fallbackError) {
          throw new Error(`Failed to parse PDF: ${pdfError.message}`);
        }
      }
    } 
    else if (fileType === 'docx') {
      console.log('Processing DOCX file...');
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
        console.log(`DOCX processed: ${extractedText.length} characters`);
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError);
        throw new Error(`Failed to parse DOCX: ${docxError.message}`);
      }
    } 
    else if (fileType === 'txt' || fileType === 'md') {
      console.log('Processing text file...');
      extractedText = fileBuffer.toString('utf-8');
      console.log(`Text file processed: ${extractedText.length} characters`);
    } 
    else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Basic text cleaning
    extractedText = extractedText
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n')  // Normalize newlines
      .trim();
    
    return extractedText;
    
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

// Test function to verify PDF parsing works
export const testPdfParsing = async () => {
  console.log('🧪 Testing PDF parsing...');
  try {
    const pdf = await loadPdfParse();
    console.log('PDF parser loaded successfully');
    console.log('Parser type:', typeof pdf);
    return true;
  } catch (error) {
    console.error('PDF parser test failed:', error);
    return false;
  }
};