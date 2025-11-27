const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Alternative PDF text extraction using a more lenient approach
 * @param {Buffer} dataBuffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text or placeholder
 */
const extractPdfTextAlternative = async (dataBuffer) => {
  try {
    // Custom PDF parse options with more lenient settings
    const options = {
      pagerender: function(pageData) {
        // Extract text from each page, ignoring errors
        try {
          return pageData.getTextContent()
            .then(function(textContent) {
              let lastY, text = '';
              for (let item of textContent.items) {
                if (lastY == item.transform[5] || !lastY)
                  text += item.str;
                else
                  text += '\n' + item.str;
                lastY = item.transform[5];
              }
              return text;
            });
        } catch (err) {
          return `[Content extraction error on page]`;
        }
      }
    };
    
    const data = await pdfParse(dataBuffer, options);
    return data.text || "PDF content could not be fully extracted";
  } catch (error) {
    console.error('Alternative PDF extraction error:', error);
    return "This PDF document appears to be damaged or protected. The text could not be extracted automatically.";
  }
};

/**
 * Extract text from different document types
 * @param {string} filePath - Path to the document file
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<string>} - Extracted text
 */
const extractText = async (filePath, fileType) => {
  try {
    // Handle PDF documents
    if (fileType.includes('pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      try {
        // Try standard PDF parsing first
        const data = await pdfParse(dataBuffer);
        return data.text;
      } catch (pdfError) {
        console.warn('Standard PDF parsing failed, trying alternative method:', pdfError.message);
        // If standard parsing fails, try alternative method
        return await extractPdfTextAlternative(dataBuffer);
      }
    }
    
    // Handle Word documents (DOCX)
    if (fileType.includes('officedocument.wordprocessingml')) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "Document content could not be fully extracted";
    }
    
    // Handle old Word documents (DOC)
    if (fileType.includes('msword')) {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value || "Document content could not be fully extracted";
      } catch (docError) {
        console.warn('DOC parsing error:', docError.message);
        return "This DOC file could not be processed. It may be password-protected or damaged.";
      }
    }
    
    // Handle plain text and RTF
    if (fileType.includes('text') || fileType.includes('rtf')) {
      const content = fs.readFileSync(filePath, 'utf8');
      return content || "Text file appears to be empty";
    }
    
    // For unsupported file types, try to extract some basic info
    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;
    return `File: ${fileName} (${fileSize} bytes) - This file type (${fileType}) cannot be processed for text extraction.`;
  } catch (error) {
    console.error('Error extracting text:', error);
    
    // Return a more specific error message based on the file type
    if (fileType.includes('pdf')) {
      return "This PDF document could not be processed. It may be corrupted, encrypted, or contain unsupported features.";
    } else if (fileType.includes('word') || fileType.includes('office')) {
      return "This Office document could not be processed. It may be password-protected or corrupted.";
    } else {
      throw new Error('Failed to extract text from document');
    }
  }
};

module.exports = { extractText };