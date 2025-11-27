const mongoose = require('mongoose');

const FreeTrialLogSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
  },
  documentName: {
    type: String,
    required: true,
  },
  documentSize: {
    type: Number,
    required: true,
  },
  documentType: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('FreeTrialLog', FreeTrialLogSchema);