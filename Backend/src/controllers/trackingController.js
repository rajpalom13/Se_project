const DoctorLocation = require('../models/DoctorLocation');
const User = require('../models/User');
const { calculateDistance } = require('../utils/haversine');

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can update location'
      });
    }

    const location = await DoctorLocation.findOneAndUpdate(
      { doctorId: req.user.id },
      {
        doctorId: req.user.id,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        timestamp: new Date(),
        isAvailable: true
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Location updated successfully',
      location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

exports.getNearbyDoctors = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query;

    const doctors = await DoctorLocation.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      isAvailable: true
    }).populate('doctorId', 'name specialization workingHospital phone');

    res.json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby doctors',
      error: error.message
    });
  }
};

exports.getDoctorLocation = async (req, res) => {
  try {
    const location = await DoctorLocation.findOne({ 
      doctorId: req.params.id 
    }).populate('doctorId', 'name specialization workingHospital phone');

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Doctor location not found'
      });
    }

    res.json({
      success: true,
      location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor location',
      error: error.message
    });
  }
};