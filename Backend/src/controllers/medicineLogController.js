const MedicineLog = require('../models/MedicineLog');
const notificationController = require('./notificationController');

// @desc    Log medicine intake
// @route   POST /api/medicine-logs
// @access  Private (Patient)
exports.logMedicine = async (req, res) => {
  try {
    const { medicineId, status, takenAt } = req.body;

    const log = await MedicineLog.create({
      medicine: medicineId,
      patient: req.user.id,
      status,
      takenAt: takenAt || Date.now()
    });

    res.status(201).json({
      success: true,
      log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging medicine',
      error: error.message
    });
  }
};

// @desc    Get logs for a patient
// @route   GET /api/medicine-logs/patient/:patientId
// @access  Private
exports.getPatientLogs = async (req, res) => {
  try {
    const patientId = req.params.patientId || req.user.id;
    const logs = await MedicineLog.find({ patient: patientId })
      .populate('medicine', 'name dosage')
      .sort({ takenAt: -1 });

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching logs',
      error: error.message
    });
  }
};

// @desc    Add doctor comment
// @route   PUT /api/medicine-logs/:id/comment
// @access  Private (Doctor)
exports.addComment = async (req, res) => {
  try {
    const log = await MedicineLog.findById(req.params.id).populate('medicine', 'name');

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    log.doctorComment = req.body.comment;
    log.doctorCommentedAt = Date.now();
    await log.save();

    // Notify patient
    const message = `Doctor ${req.user.name} commented on your medicine intake (${log.medicine.name}): "${req.body.comment}"`;
    
    await notificationController.createNotification({
      recipient: log.patient,
      message,
      type: 'update'
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('patient:update', {
        patientId: log.patient,
        type: 'medicine_comment',
        message
      });
    }

    res.json({
      success: true,
      log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};
