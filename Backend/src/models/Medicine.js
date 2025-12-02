

// backend/src/models/Medicine.js
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['once', 'twice', 'thrice', 'custom']
  },
  timings: [{
    type: String,
    required: true
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  instructions: String,
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  adherence: [{
    date: Date,
    time: String,
    taken: Boolean,
    takenAt: Date
  }],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Medicine', medicineSchema);