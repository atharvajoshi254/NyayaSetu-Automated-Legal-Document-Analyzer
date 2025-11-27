const path = require('path');
const fs = require('fs');
const asyncHandler = require('express-async-handler');
const { summarizeDocument } = require('../services/aiService');
const FreeTrialLog = require('../models/FreeTrialLog');

// Ensure upload directories exist
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Create temporary upload directory for free trials
const tempUploadDir = path.join(__dirname, '../uploads/temp');
ensureDirectoryExists(tempUploadDir);

/**
 * @desc    Upload a document for free trial summarization
 * @route   POST /api/free-trial/upload
 * @access  Public
 */
const uploadTrialDocument = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    // Process the file
    const file = req.file;
    const fileType = path.extname(file.originalname).toLowerCase();
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
    
    if (!allowedTypes.includes(fileType)) {
      fs.unlinkSync(file.path);
      res.status(400);
      throw new Error('Invalid file type. Please upload PDF, DOC, DOCX, TXT or RTF files only.');
    }

    // Check if Hindi translation is requested
    const translateToHindi = req.query.language === 'hindi' || req.body.language === 'hindi';

    // Log the free trial usage
    await FreeTrialLog.create({
      ipAddress: req.ip,
      documentName: file.originalname,
      documentSize: file.size,
      documentType: path.extname(file.originalname).toLowerCase().replace('.', '')
    });

    // Generate a summary using AI service
    try {
      // Pass the translation flag to the summarizeDocument function
      const summary = await summarizeDocument(file.path, translateToHindi);
      
      // Delete the temporary file after processing
      setTimeout(() => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting temporary file:', err);
        }
      }, 5000); // Delete after 5 seconds to allow any post-processing
  
      // Return the summary
      res.status(200).json({
        success: true,
        language: translateToHindi ? 'hindi' : 'english',
        summary: {
          keyPoints: summary.keyPoints || [],
          summary: summary.summary || 'Summary not available',
          documentType: summary.documentType || 'Unknown',
          documentTitle: summary.documentTitle || file.originalname || 'Untitled Document',
          language: translateToHindi ? 'hindi' : 'english',
        }
      });
    } catch (summaryError) {
      console.error('Error generating document summary:', summaryError);
      
      // Still count this as a trial usage even if it failed
      // Delete the file since we're done with it
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
      
      // Return a more user-friendly error
      res.status(422).json({
        success: false,
        message: 'Unable to generate summary for this document. Please try a different file or format.'
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(error.message || 'Failed to process document');
  }
});

module.exports = {
  uploadTrialDocument,
};