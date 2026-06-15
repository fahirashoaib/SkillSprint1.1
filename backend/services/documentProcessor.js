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

const DEFAULT_CHUNK_SIZE = 2000;
const DEFAULT_CHUNK_OVERLAP = 200;

/**
 * Split text into overlapping chunks for AI context windows.
 */
export const chunkText = (text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP) => {
  const normalized = (text || '').trim();
  if (!normalized) return [];

  if (normalized.length <= chunkSize) {
    return [normalized];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      const slice = normalized.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf(' ')
      );
      if (breakAt > chunkSize * 0.5) {
        end = start + breakAt + (slice[breakAt] === ' ' ? 1 : 2);
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
};

/**
 * Build step-appropriate context from the full document text.
 */
export const getContextForStep = (text, step, { unitIndex = 0, totalUnits = 1, maxLen = 2400 } = {}) => {
  const chunks = chunkText(text);
  if (!chunks.length) return '';

  const joinParts = (parts) => {
    const joined = parts.filter(Boolean).join('\n\n---\n\n');
    if (joined.length <= maxLen) return joined;
    return joined.slice(0, maxLen);
  };

  if (step === 'overview') {
    const indices = new Set([0]);
    if (chunks.length > 2) indices.add(Math.floor(chunks.length / 2));
    if (chunks.length > 1) indices.add(chunks.length - 1);
    return joinParts([...indices].sort((a, b) => a - b).map((i) => chunks[i]));
  }

  if (step === 'units') {
    const sampleCount = Math.min(chunks.length, 5);
    const stepSize = Math.max(1, Math.floor(chunks.length / sampleCount));
    const parts = [];
    for (let i = 0; i < chunks.length && parts.length < sampleCount; i += stepSize) {
      parts.push(chunks[i]);
    }
    if (parts[parts.length - 1] !== chunks[chunks.length - 1]) {
      parts.push(chunks[chunks.length - 1]);
    }
    return joinParts(parts);
  }

  if (step === 'unit-content') {
    const safeTotal = Math.max(1, totalUnits);
    const primaryIndex = Math.min(
      chunks.length - 1,
      Math.floor((unitIndex / safeTotal) * chunks.length)
    );
    const parts = [chunks[primaryIndex]];
    if (primaryIndex > 0) parts.unshift(chunks[primaryIndex - 1]);
    if (primaryIndex < chunks.length - 1) parts.push(chunks[primaryIndex + 1]);
    return joinParts(parts);
  }

  return chunks[0].slice(0, maxLen);
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