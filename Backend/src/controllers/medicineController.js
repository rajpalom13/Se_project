const Medicine = require('../models/Medicine');
const { sendSMS } = require('../services/smsService');

exports.getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ 
      patient: req.user.id,
      active: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: medicines.length,
      medicines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medicines',
      error: error.message
    });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    const medicineData = {
      ...req.body,
      patient: req.user.id
    };

    const medicine = await Medicine.create(medicineData);

    res.status(201).json({
      success: true,
      message: 'Medicine reminder created successfully',
      medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating medicine reminder',
      error: error.message
    });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    if (medicine.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this medicine'
      });
    }

    Object.keys(req.body).forEach(key => {
      medicine[key] = req.body[key];
    });

    await medicine.save();

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating medicine',
      error: error.message
    });
  }
};

exports.markMedicineTaken = async (req, res) => {
  try {
    const { taken, time } = req.body;
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    medicine.adherence.push({
      date: new Date(),
      time,
      taken,
      takenAt: taken ? new Date() : null
    });

    await medicine.save();

    res.json({
      success: true,
      message: 'Medicine status updated',
      medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating medicine status',
      error: error.message
    });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    if (medicine.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this medicine'
      });
    }

    medicine.active = false;
    await medicine.save();

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting medicine',
      error: error.message
    });
  }
};