const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  documentOverview: {
    type: String,
    required: true
  },
  keyParties: {
    type: [String],
    default: []
  },
  importantClauses: {
    type: [String],
    default: []
  },
  obligations: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  criticalDates: {
    type: [String],
    default: []
  },
  potentialConcerns: {
    type: [String],
    default: []
  },
  plainLanguageSummary: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Summary', summarySchema);