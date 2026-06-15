import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Heuristic check that extracted content is real text, not raw PDF/binary bytes.
 */
export const isReadableText = (text) => {
  const sample = (text || '').slice(0, 8000);
  if (sample.length < 20) return false;

  const letterCount = (sample.match(/[a-zA-Z]/g) || []).length;
  if (letterCount / sample.length < 0.15) return false;

  const wordCount = (sample.match(/[a-zA-Z]{2,}/g) || []).length;
  return wordCount >= 10;
};

const extractPdfText = async (fileBuffer) => {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getText();
    return {
      text: (result.text || '').trim(),
      pageCount: result.total || 0
    };
  } finally {
    await parser.destroy();
  }
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
        const { text, pageCount } = await extractPdfText(fileBuffer);
        extractedText = text;
        console.log(`PDF processed: ${pageCount} pages, ${extractedText.length} characters`);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        throw new Error(`Failed to parse PDF: ${pdfError.message}`);
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
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    if (!isReadableText(extractedText)) {
      throw new Error(
        'Extracted text appears unreadable. The file may be scanned, encrypted, or corrupted. Try a text-based PDF or DOCX.'
      );
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

// Test function to verify PDF parsing works
export const testPdfParsing = async () => {
  console.log('Testing PDF parsing...');
  try {
    const sample = Buffer.from('%PDF-1.4');
    const parser = new PDFParse({ data: sample });
    await parser.destroy();
    console.log('PDF parser loaded successfully');
    return true;
  } catch (error) {
    console.error('PDF parser test failed:', error);
    return false;
  }
};