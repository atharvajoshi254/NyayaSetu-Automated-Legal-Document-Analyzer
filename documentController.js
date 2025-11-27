const path = require('path');
const fs = require('fs');
const asyncHandler = require('express-async-handler');
const Document = require('../models/Document');
const Summary = require('../models/Summary');
const { summarizeText } = require('../utils/gemini');
const { extractText } = require('../utils/documentParser');

// @desc    Upload a new document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please upload a file' 
    });
  }

  // Get file information
  const { filename, mimetype, size, path: filePath } = req.file;
  
  try {
    // Extract text from the document using our utility function
    const text = await extractText(filePath, mimetype);
    
    // Check if the extracted text is an error message (our function now returns error messages instead of throwing)
    const isErrorMessage = typeof text === 'string' && 
      (text.includes('could not be processed') || 
       text.includes('could not be extracted') || 
       text.includes('cannot be processed'));
    
    // Create document in database
    const document = await Document.create({
      fileName: filename,
      fileType: mimetype,
      filePath: filePath,
      fileSize: size,
      content: text,
      user: req.user._id,
      processingError: isErrorMessage ? text : null  // Store error message if there was one
    });

    if (isErrorMessage) {
      // Return success but with a warning if text extraction had issues
      res.status(201).json({
        success: true,
        warning: "Document was uploaded but text extraction was partial or failed",
        document: {
          _id: document._id,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          createdAt: document.createdAt,
          processingError: true
        }
      });
    } else {
      // Normal success response
      res.status(201).json({
        success: true,
        document: {
          _id: document._id,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          createdAt: document.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Clean up file if document creation fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process the document: ' + error.message
    });
  }
});

// @desc    Get all documents for current user
// @route   GET /api/documents/user
// @access  Private
const getUserDocuments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const total = await Document.countDocuments({ user: req.user._id });
  
  const documents = await Document.find({ user: req.user._id })
    .select('fileName fileType fileSize createdAt summary')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('summary', 'createdAt');

  res.status(200).json({
    success: true,
    count: documents.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    documents
  });
});

// @desc    Get single document with summary
// @route   GET /api/documents/:id
// @access  Private
const getDocument = asyncHandler(async (req, res) => {
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

  res.status(200).json({
    success: true,
    document: {
      _id: document._id,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      createdAt: document.createdAt,
      user: {
        _id: document.user._id,
        name: document.user.name,
        email: document.user.email
      },
      summary: document.summary
    }
  });
});

// @desc    Generate summary for a document
// @route   POST /api/documents/:id/summarize
// @access  Private
const generateSummary = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check if user owns the document or is admin
  if (document.user.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to summarize this document'
    });
  }

  try {
    // Check if summary already exists
    if (document.summary) {
      const existingSummary = await Summary.findById(document.summary);
      if (existingSummary) {
        return res.status(200).json({
          success: true,
          message: 'Summary already exists',
          summary: existingSummary
        });
      }
    }

    // Check if the document had processing errors
    if (document.processingError) {
      // Create a special summary for documents that couldn't be properly processed
      const summaryObj = {
        document: document._id,
        documentOverview: "This document could not be fully processed due to format issues or damage.",
        keyParties: ["Cannot be determined from the document content"],
        importantClauses: ["Document content extraction was limited or failed"],
        obligations: {}, // Empty obligations object since we've removed this section
        criticalDates: ["Not available due to processing limitations"],
        potentialConcerns: [
          "Document may be damaged, corrupted or in an unsupported format",
          "Consider uploading a different version of this document",
          "The file may be password-protected or encrypted"
        ],
        plainLanguageSummary: "This document could not be properly analyzed because our system encountered issues extracting the text content. This could be due to password protection, encryption, damage to the file, or an unsupported format. Consider uploading a different version of the document if possible."
      };
      
      // Create summary in database
      const summary = await Summary.create(summaryObj);

      // Update document with summary reference
      document.summary = summary._id;
      await document.save();

      return res.status(201).json({
        success: true,
        message: 'Limited summary generated for document with processing issues',
        warning: document.processingError,
        summary
      });
    }

    // Generate summary using Gemini AI for documents without processing errors
    const summaryData = await summarizeText(document.content);
    
    // Ensure the data structure matches our schema
    const summaryObj = {
      document: document._id,
      documentOverview: summaryData.documentOverview || "No overview available",
      keyParties: summaryData.keyParties || [],
      importantClauses: summaryData.importantClauses || [],
      obligations: summaryData.obligations || {},
      criticalDates: summaryData.criticalDates || [],
      potentialConcerns: summaryData.potentialConcerns || [],
      plainLanguageSummary: summaryData.plainLanguageSummary || "No plain language summary available"
    };

    // Create summary in database
    const summary = await Summary.create(summaryObj);

    // Update document with summary reference
    document.summary = summary._id;
    await document.save();

    res.status(201).json({
      success: true,
      message: 'Summary generated successfully',
      summary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary: ' + error.message
    });
  }
});

// @desc    Delete a document and its summary
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check if user owns the document or is admin
  if (document.user.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this document'
    });
  }

  try {
    // Delete summary if exists
    if (document.summary) {
      await Summary.findByIdAndDelete(document.summary);
    }
    
    // Delete file from storage
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // Delete document from database
    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

module.exports = {
  uploadDocument,
  getUserDocuments,
  getDocument,
  generateSummary,
  deleteDocument
};