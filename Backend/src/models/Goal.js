const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now // Reset daily logic or store daily records
  }
}, {
  timestamps: true
});

// Ensure we fetch goals for a specific day easily
// For simplicity, we will create goals for "today" if not exist on frontend or backend.
// Let's just store them.

module.exports = mongoose.model('Goal', goalSchema);
