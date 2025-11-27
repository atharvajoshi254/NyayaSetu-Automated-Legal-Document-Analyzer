const asyncHandler = require('express-async-handler');
const Summary = require('../models/Summary');
const Document = require('../models/Document');
const { translateSummary, translateText, translateWithAI, translateObject } = require('../utils/translationService');

/**
 * @desc    Translate a document summary to Hindi
 * @route   GET /api/documents/:id/translate
 * @access  Private
 */
const translateDocumentSummary = asyncHandler(async (req, res) => {
  // Find the document
  const document = await Document.findById(req.params.id)
    .populate('summary')
    .populate('user', 'name email');

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check if user owns the document or is admin
  if (document.user._id.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this document'
    });
  }

  // Check if summary exists
  if (!document.summary) {
    return res.status(404).json({
      success: false,
      message: 'Document summary not found. Generate a summary first.'
    });
  }

  try {
    // Always use AI for registered users to ensure complete translation
    const useAI = true;
    
    // Always enforce complete translation for registered users
    const enforceComplete = true;
    
    // Log the translation request
    console.log(`Translating summary for document ${document._id} with AI translation (enforceComplete=${enforceComplete})`);

    // Translate the summary with the enforceComplete flag
    const translatedSummary = await translateSummary(document.summary, useAI, enforceComplete);

    // Verify all fields for English words
    const englishRegex = /[a-zA-Z]{3,}/; // Look for English words (3+ letters)
    const containsEnglish = (text) => {
      return typeof text === 'string' && englishRegex.test(text);
    };

    // Check all major fields for remaining English
    const fieldsToCheck = [
      translatedSummary.documentOverview,
      ...(translatedSummary.keyParties || []),
      ...(translatedSummary.importantClauses || []),
      ...(translatedSummary.criticalDates || []),
      ...(translatedSummary.potentialConcerns || []),
      translatedSummary.plainLanguageSummary
    ];
    
    // Track fields that might need further processing
    const fieldsWithEnglish = fieldsToCheck
      .filter(field => containsEnglish(field))
      .length;
    
    const responseMessage = fieldsWithEnglish > 0
      ? `Summary translated with ${fieldsWithEnglish} fields needing additional refinement`
      : 'Summary completely translated to Hindi successfully';
    
    res.status(200).json({
      success: true,
      message: responseMessage,
      originalLanguage: 'English',
      targetLanguage: 'Hindi',
      translatedSummary
    });
  } catch (error) {
    console.error('Error translating summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate summary: ' + error.message
    });
  }
});

/**
 * @desc    Translate document text to Hindi
 * @route   POST /api/documents/:id/translate-text
 * @access  Private
 */
const translateDocumentText = asyncHandler(async (req, res) => {
  // Find the document
  const document = await Document.findById(req.params.id)
    .populate('user', 'name email');

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check if user owns the document or is admin
  if (document.user._id.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this document'
    });
  }

  try {
    // Get the text to translate - could be the full document or a specific section
    const { text, section } = req.body;
    
    // If no specific text provided, use the document content
    const contentToTranslate = text || (section ? document.content[section] : document.content);
    
    if (!contentToTranslate) {
      return res.status(400).json({
        success: false,
        message: 'No content found to translate'
      });
    }

    // Always use AI for full document text translation as it's likely complex
    const translatedText = await translateWithAI(contentToTranslate);

    res.status(200).json({
      success: true,
      message: 'Text translated successfully',
      originalLanguage: 'English',
      targetLanguage: 'Hindi',
      translatedText
    });
  } catch (error) {
    console.error('Error translating document text:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate text: ' + error.message
    });
  }
});

/**
 * @desc    Translate specific legal term to Hindi
 * @route   POST /api/translate/term
 * @access  Public
 */
const translateLegalTerm = asyncHandler(async (req, res) => {
  const { term } = req.body;
  
  if (!term) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a term to translate'
    });
  }
  
  try {
    // Check if it's a JSON string that needs to be translated as a whole object
    if (typeof term === 'string' && (term.startsWith('{') || term.startsWith('['))) {
      try {
        // Parse the JSON object
        const parsedTerm = JSON.parse(term);
        
        // Determine if it's an object that needs translation
        if (typeof parsedTerm === 'object') {
          // Use the translateObject utility to translate the entire object
          const translatedObj = await translateObject(parsedTerm, true);
          const translatedTerm = JSON.stringify(translatedObj);
          
          return res.status(200).json({
            success: true,
            originalTerm: term,
            translatedTerm
          });
        }
      } catch (jsonError) {
        // If JSON parsing fails, treat it as a regular string
        console.warn('JSON parsing failed, treating as text:', jsonError);
      }
    }
    
    // Use AI for more accurate translation of legal terms
    const translatedTerm = await translateWithAI(term);
    
    res.status(200).json({
      success: true,
      originalTerm: term,
      translatedTerm
    });
  } catch (error) {
    console.error('Error translating term:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate term: ' + error.message
    });
  }
});

module.exports = {
  translateDocumentSummary,
  translateDocumentText,
  translateLegalTerm
};