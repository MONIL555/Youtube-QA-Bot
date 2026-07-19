import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import officeParser from 'officeparser';
import fs from 'fs';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);

export const parseDocument = async (filePath, mimeType) => {
  try {
    let extractedText = '';

    if (mimeType === 'application/pdf') {
      const dataBuffer = await readFileAsync(filePath);
      const parser = new pdfParse.PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      extractedText = data.text;
      await parser.destroy();
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimeType === 'application/msword'
    ) {
      // DOCX processing
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (
      mimeType === 'application/vnd.ms-powerpoint' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      // PPTX / PPT processing
      extractedText = await officeParser.parseOfficeAsync(filePath);
    } else if (mimeType === 'text/plain') {
      // TXT processing
      extractedText = await readFileAsync(filePath, 'utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("Could not extract any text from the document. It might be scanned or empty.");
    }

    // Limit text length to prevent exceeding token limits (rough approximation ~ 300,000 characters)
    // Gemini 1.5 can handle 1M+ tokens, but good to have a sanity limit
    const MAX_CHARS = 500_000;
    if (extractedText.length > MAX_CHARS) {
      extractedText = extractedText.substring(0, MAX_CHARS) + "\n...[Document truncated due to length limitations]";
    }

    return extractedText.trim();
  } catch (err) {
    console.error("Document parsing error:", err);
    throw new Error(`Failed to parse document: ${err.message}`);
  }
};
