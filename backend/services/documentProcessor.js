import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import fs from 'fs';

export const extractText = async (filePath, fileType) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    if (fileType === 'pdf') {
      const data = await pdf(fileBuffer);
      return data.text;
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } else if (fileType === 'txt') {
      return fileBuffer.toString('utf-8');
    }
    
    throw new Error('Unsupported file type');
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

