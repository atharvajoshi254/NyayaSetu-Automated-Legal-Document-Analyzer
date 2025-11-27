const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { extractText } = require('../utils/documentParser');
const { summarizeText } = require('../utils/gemini');

// Initialize Google AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the model with appropriate version
const getModel = async () => {
  // Use the model from environment variable, fallback to "gemini-pro" if not set
  const modelName = process.env.GEMINI_MODEL || "gemini-pro";
  console.log(`AI Service using Gemini model: ${modelName}`);
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Extract text content from a document
 * @param {string} filePath - Path to the document file
 * @returns {string} - Extracted text content
 */
const extractDocumentText = async (filePath) => {
  try {
    // Use the document parser utility to extract text based on file type
    const fileType = path.extname(filePath).toLowerCase();
    const text = await extractText(filePath, `application/${fileType.replace('.', '')}`);
    
    if (typeof text === 'string' && (
      text.includes('could not be processed') || 
      text.includes('could not be extracted') || 
      text.includes('cannot be processed')
    )) {
      // If there was an extraction error, fall back to simple text reading
      return fs.readFileSync(filePath, 'utf-8');
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from document:', error);
    // Fall back to simple text reading if extraction fails
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (readError) {
      return 'Unable to extract text from document.';
    }
  }
};

/**
 * Summarize a document using Google's Generative AI
 * @param {string} filePath - Path to the document file
 * @param {boolean} translateToHindi - Whether to translate the summary to Hindi
 * @returns {Object} - Document summary
 */
const summarizeDocument = async (filePath, translateToHindi = false) => {
  try {
    // Extract text from the document
    const text = await extractDocumentText(filePath);
    
    if (!text || text === 'Unable to extract text from document.') {
      throw new Error('Failed to extract text from document');
    }
    
    // Get a condensed version of the text to summarize (limit to 5000 chars)
    const condensedText = text.length > 5000 ? text.substring(0, 5000) + '...' : text;
    
    // Use Gemini AI to generate a summary
    const fullSummary = await summarizeText(condensedText);
    
    // Extract key points from the important clauses and obligations
    const keyPointsFromClauses = fullSummary.importantClauses.slice(0, 3);
    const keyPoints = [
      fullSummary.documentOverview,
      ...keyPointsFromClauses
    ].filter(point => point && point.length > 0);
    
    // Create a concise summary for the free trial version
    const summary = {
      documentType: 'Legal Document',
      documentTitle: path.basename(filePath),
      keyPoints: keyPoints.length > 0 ? keyPoints : ['No key points could be extracted from this document.'],
      summary: fullSummary.plainLanguageSummary || 'No summary could be generated for this document.'
    };
    
    // If Hindi translation is requested, translate the entire summary
    if (translateToHindi) {
      try {
        // Dynamically import the translation service to avoid circular dependencies
        const { translateWithAI } = require('../utils/translationService');
        
        // Always enforce complete translation with no English words for better user experience
        const enforceComplete = true;
        
        // Translate keyPoints using AI for accuracy with complete translation
        summary.keyPoints = await Promise.all(
          summary.keyPoints.map(point => translateWithAI(point, enforceComplete))
        );
        
        // Translate main summary with complete translation
        summary.summary = await translateWithAI(summary.summary, enforceComplete);
        
        // Add language indicator
        summary.language = 'hindi';
        
        // Verify that translation was successful
        const hasEnglishWords = (text) => /[a-zA-Z]{3,}/.test(text);
        const fieldsWithEnglish = [
          ...summary.keyPoints,
          summary.summary
        ].filter(text => hasEnglishWords(text));
        
        // Log any remaining English words for debugging
        if (fieldsWithEnglish.length > 0) {
          console.warn(`Translation completed, but ${fieldsWithEnglish.length} fields still contain English words`);
        }
      } catch (translationError) {
        console.error('Error translating summary to Hindi:', translationError);
        // Continue with English summary if translation fails
      }
    }
    
    return summary;
  } catch (error) {
    console.error('Error summarizing document:', error);
    throw new Error('Failed to summarize document: ' + error.message);
  }
};

module.exports = {
  summarizeDocument,
  extractDocumentText
};