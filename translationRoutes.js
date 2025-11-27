const express = require('express');
const { 
  translateDocumentSummary,
  translateDocumentText,
  translateLegalTerm
} = require('../controllers/translationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected routes that require authentication
router.get('/documents/:id/translate', protect, translateDocumentSummary);
router.post('/documents/:id/translate-text', protect, translateDocumentText);

// Public route for translating individual terms
router.post('/term', translateLegalTerm);

module.exports = router;