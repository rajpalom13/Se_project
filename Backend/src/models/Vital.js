const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['blood_pressure', 'heart_rate', 'blood_sugar', 'weight', 'temperature', 'oxygen_level']
  },
  value: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vital', vitalSchema);
