const Vital = require('../models/Vital');
const notificationController = require('./notificationController');

// @desc    Get all vitals
// @route   GET /api/vitals
// @access  Private
exports.getVitals = async (req, res) => {
  try {
    const vitals = await Vital.find({ user: req.user.id })
      .sort({ date: -1 }); // Newest first

    res.json({
      success: true,
      count: vitals.length,
      vitals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vitals',
      error: error.message
    });
  }
};

// @desc    Get vitals by patient ID (for doctors)
// @route   GET /api/vitals/patient/:id
// @access  Private (Doctor)
exports.getPatientVitals = async (req, res) => {
  try {
    // Ideally check if doctor is authorized to view this patient
    const vitals = await Vital.find({ user: req.params.id })
      .sort({ date: 1 }); // Oldest first for charts

    res.json({
      success: true,
      vitals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient vitals',
      error: error.message
    });
  }
};

// @desc    Add new vital
// @route   POST /api/vitals
// @access  Private
exports.addVital = async (req, res) => {
  try {
    const { type, value, unit, notes, date } = req.body;

    const vital = await Vital.create({
      user: req.user.id,
      type,
      value,
      unit,
      notes,
      date: date || Date.now()
    });

    // Predictive Analytics / Risk Check
    try {
      let riskMessage = null;
      
      if (type === 'blood_pressure') {
        const [sys, dia] = value.split('/').map(Number);
        if (sys >= 140 || dia >= 90) {
          riskMessage = `High Blood Pressure detected (${value}). Please consult your doctor.`;
        } else if (sys <= 90 || dia <= 60) {
          riskMessage = `Low Blood Pressure detected (${value}). Monitor closely.`;
        }
      } else if (type === 'heart_rate') {
        const hr = Number(value);
        if (hr > 100) riskMessage = `High Heart Rate detected (${value} bpm).`;
        if (hr < 50) riskMessage = `Low Heart Rate detected (${value} bpm).`;
      } else if (type === 'blood_sugar') {
        const sugar = Number(value);
        if (sugar > 180) riskMessage = `High Blood Sugar detected (${value} mg/dL).`;
        if (sugar < 70) riskMessage = `Low Blood Sugar detected (${value} mg/dL).`;
      } else if (type === 'temperature') {
        const temp = Number(value);
        if (temp > 38) riskMessage = `Fever detected (${value} °C).`;
      }

      if (riskMessage) {
        const message = `⚠️ Health Alert: ${riskMessage}`;
        
        await notificationController.createNotification({
          recipient: req.user.id,
          message,
          type: 'emergency'
        });
        
        const io = req.app.get('io');
        if (io) {
          io.emit('patient:health_alert', {
            recipient: req.user.id,
            message
          });
        }
      }
    } catch (err) {
      console.error('Error in analytics:', err);
    }

    res.status(201).json({
      success: true,
      vital
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding vital',
      error: error.message
    });
  }
};

// @desc    Delete vital
// @route   DELETE /api/vitals/:id
// @access  Private
exports.deleteVital = async (req, res) => {
  try {
    const vital = await Vital.findById(req.params.id);

    if (!vital) {
      return res.status(404).json({
        success: false,
        message: 'Vital record not found'
      });
    }

    if (vital.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await vital.deleteOne();

    res.json({
      success: true,
      message: 'Vital record removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting vital',
      error: error.message
    });
  }
};
