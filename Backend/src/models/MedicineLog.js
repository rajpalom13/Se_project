const mongoose = require('mongoose');

const medicineLogSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  takenAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['taken', 'missed', 'skipped'],
    default: 'taken'
  },
  doctorComment: {
    type: String
  },
  doctorCommentedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicineLog', medicineLogSchema);
