const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { uploadTrialDocument } = require('../controllers/freeTrialController');

// Rate limiting specifically for free trial to prevent abuse
const freeTrialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // max 5 requests per hour per IP
  message: 'Too many free trial requests from this IP, please try again later or register for full access'
});

// Set up multer storage for free trial uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/temp'));
  },
  filename: (req, file, cb) => {
    // Use a timestamp to avoid filename collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'trial-' + uniqueSuffix + fileExt);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

// Routes
router.post('/upload', freeTrialLimiter, upload.single('document'), uploadTrialDocument);

module.exports = router;