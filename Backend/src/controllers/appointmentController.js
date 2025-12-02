// backend/src/controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

exports.getAppointments = async (req, res) => {
  try {
    const query = req.user.role === 'doctor' 
      ? { doctor: req.user.id }
      : { patient: req.user.id };

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization workingHospital')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    // Validate doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      date,
      time,
      reason,
      status: 'pending'
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization workingHospital');

    // Send notification email
    await sendEmail({
      to: doctor.email,
      subject: 'New Appointment Request',
      text: `You have a new appointment request from ${req.user.name} for ${date} at ${time}.`
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: populatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Authorization check
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    appointment.status = status || appointment.status;
    appointment.notes = notes || appointment.notes;
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization workingHospital');

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: populatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message
    });
  }
};