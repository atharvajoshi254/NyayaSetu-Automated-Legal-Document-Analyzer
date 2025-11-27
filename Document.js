const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  summary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Summary',
    default: null
  },
  processingError: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for file extension
documentSchema.virtual('fileExtension').get(function() {
  if (!this.fileName) return '';
  const lastDot = this.fileName.lastIndexOf('.');
  return lastDot === -1 ? '' : this.fileName.substring(lastDot + 1);
});

module.exports = mongoose.model('Document', documentSchema);