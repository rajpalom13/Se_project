// backend/src/utils/seedData.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Medicine = require('../models/Medicine');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Medicine.deleteMany({});

    // Create doctors
    const doctors = await User.create([
      {
        name: 'Dr. Sarah Johnson',
        email: 'doctor@test.com',
        password: 'Doctor123!',
        phone: '+1234567890',
        role: 'doctor',
        specialization: 'Cardiology',
        workingHospital: 'City General Hospital',
        shiftTiming: { start: '09:00', end: '17:00' },
        licenseNumber: 'MED123456'
      },
      {
        name: 'Dr. Michael Chen',
        email: 'doctor2@test.com',
        password: 'Doctor123!',
        phone: '+1234567891',
        role: 'doctor',
        specialization: 'Neurology',
        workingHospital: 'Central Medical Center',
        shiftTiming: { start: '10:00', end: '18:00' },
        licenseNumber: 'MED123457'
      }
    ]);

    // Create patients
    const patients = await User.create([
      {
        name: 'John Doe',
        email: 'patient@test.com',
        password: 'Patient123!',
        phone: '+1234567892',
        role: 'patient',
        age: 35,
        disease: 'Hypertension',
        hospitalAdmitted: 'City General Hospital',
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+1234567893',
          relation: 'Spouse'
        }
      },
      {
        name: 'Alice Smith',
        email: 'patient2@test.com',
        password: 'Patient123!',
        phone: '+1234567894',
        role: 'patient',
        age: 28,
        disease: 'Diabetes Type 2',
        hospitalAdmitted: 'Central Medical Center',
        emergencyContact: {
          name: 'Bob Smith',
          phone: '+1234567895',
          relation: 'Father'
        }
      }
    ]);

    // Create appointments
    await Appointment.create([
      {
        patient: patients[0]._id,
        doctor: doctors[0]._id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        time: '10:00',
        reason: 'Regular checkup',
        status: 'confirmed'
      },
      {
        patient: patients[1]._id,
        doctor: doctors[1]._id,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        time: '14:00',
        reason: 'Follow-up consultation',
        status: 'pending'
      }
    ]);

    // Create medicine reminders
    await Medicine.create([
      {
        patient: patients[0]._id,
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'once',
        timings: ['08:00'],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        instructions: 'Take with water before breakfast',
        reminderEnabled: true
      },
      {
        patient: patients[1]._id,
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice',
        timings: ['08:00', '20:00'],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        instructions: 'Take with meals',
        reminderEnabled: true
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('Doctor: doctor@test.com / Doctor123!');
    console.log('Patient: patient@test.com / Patient123!');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();