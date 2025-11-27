const express = require('express');
const { 
  uploadDocument, 
  getUserDocuments, 
  getDocument, 
  generateSummary, 
  deleteDocument
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + fileExt);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only specified file types
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload PDF, DOCX, RTF, or TXT file'), false);
  }
};

// Initialize upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes with protection middleware
router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/user', getUserDocuments);
router.get('/:id', getDocument);
router.post('/:id/summarize', generateSummary);
router.delete('/:id', deleteDocument);

module.exports = router;