const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String // Path to uploaded file (PDF/Image)
  },
  type: {
    type: String,
    enum: ['clinical_note', 'lab_report', 'imaging', 'other'],
    default: 'clinical_note'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
