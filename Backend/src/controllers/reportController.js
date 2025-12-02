const Report = require('../models/Report');
const notificationController = require('./notificationController');

// @desc    Get reports for a patient
// @route   GET /api/reports/patient/:patientId
// @access  Private
exports.getPatientReports = async (req, res) => {
  try {
    // If param exists use it, otherwise use logged in user's ID (for "My Reports")
    const patientId = req.params.patientId || req.user.id;
    
    const reports = await Report.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// @desc    Add new report/note
// @route   POST /api/reports
// @access  Private (Doctor)
exports.addReport = async (req, res) => {
  try {
    const { patientId, title, notes, type } = req.body;

    const report = await Report.create({
      doctor: req.user.id,
      patient: patientId,
      title,
      notes,
      type: type || 'clinical_note',
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null
    });

    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Add report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message
    });
  }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private (Doctor)
exports.updateReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.doctor.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { title, notes, type } = req.body;
    
    report.title = title || report.title;
    report.notes = notes || report.notes;
    report.type = type || report.type;
    if (req.file) {
      report.fileUrl = `/uploads/${req.file.filename}`;
    }

    await report.save();

    // Notify patient
    const message = `Your report "${report.title}" has been updated by Dr. ${req.user.name}`;
    
    // Save notification
    await notificationController.createNotification({
      recipient: report.patient,
      message,
      type: 'update'
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('patient:update', {
        patientId: report.patient,
        type: 'report',
        message
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
};
