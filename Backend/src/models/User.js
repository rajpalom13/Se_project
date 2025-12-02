const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'doctor'],
    required: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  // Patient-specific fields
  age: {
    type: Number,
    required: function() { return this.role === 'patient'; }
  },
  disease: {
    type: String,
    required: function() { return this.role === 'patient'; }
  },
  hospitalAdmitted: {
    type: String,
    required: function() { return this.role === 'patient'; }
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  // Doctor-specific fields
  specialization: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  workingHospital: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  shiftTiming: {
    start: String,
    end: String
  },
  licenseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return; // no next needed
  this.password = await bcrypt.hash(this.password, 10);
});


// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);