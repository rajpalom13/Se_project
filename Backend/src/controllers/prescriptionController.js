const Prescription = require('../models/Prescription');
const notificationController = require('./notificationController');

// @desc    Get prescriptions for a patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.params.patientId || req.user.id;
    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });

    res.json({
      success: true,
      prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions',
      error: error.message
    });
  }
};

// @desc    Add new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
exports.addPrescription = async (req, res) => {
  try {
    const { patientId, medicines, notes } = req.body;
    let parsedMedicines = [];
    
    if (typeof medicines === 'string') {
      try {
        parsedMedicines = JSON.parse(medicines);
      } catch (e) {
        console.error('Error parsing medicines:', e);
      }
    } else {
      parsedMedicines = medicines;
    }

    const prescription = await Prescription.create({
      doctor: req.user.id,
      patient: patientId,
      medicines: parsedMedicines,
      notes,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null
    });

    res.status(201).json({
      success: true,
      prescription
    });
  } catch (error) {
    console.error('Add prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: error.message
    });
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor)
exports.updatePrescription = async (req, res) => {
  try {
    let prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (prescription.doctor.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { medicines, notes } = req.body;
    
    if (medicines) {
      let parsedMedicines = [];
      if (typeof medicines === 'string') {
        try {
          parsedMedicines = JSON.parse(medicines);
        } catch (e) {
          console.error('Error parsing medicines:', e);
        }
      } else {
        parsedMedicines = medicines;
      }
      prescription.medicines = parsedMedicines;
    }

    if (notes) prescription.notes = notes;
    
    if (req.file) {
      prescription.imageUrl = `/uploads/${req.file.filename}`;
    }

    await prescription.save();

    // Notify patient
    const message = `Your prescription has been updated by Dr. ${req.user.name}`;
    
    // Save notification
    await notificationController.createNotification({
      recipient: prescription.patient,
      message,
      type: 'update'
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('patient:update', {
        patientId: prescription.patient,
        type: 'prescription',
        message
      });
    }

    res.json({
      success: true,
      prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating prescription',
      error: error.message
    });
  }
};
