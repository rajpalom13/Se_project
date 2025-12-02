// backend/src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const vitalRoutes = require('./routes/vitalRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const medicineLogRoutes = require('./routes/medicineLogRoutes');
const symptomRoutes = require('./routes/symptomRoutes');
const messageRoutes = require('./routes/messageRoutes');
const goalRoutes = require('./routes/goalRoutes');
const path = require('path');

// Import services
const notificationController = require('./controllers/notificationController');
const cronService = require('./services/cronService');
const User = require('./models/User');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meditrack', {
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/medicine-logs', medicineLogRoutes);
app.use('/api/symptom', symptomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/goals', goalRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 New WebSocket connection:', socket.id);

  // Doctor location updates
  socket.on('doctor:location:update', async (data) => {
    const { doctorId, latitude, longitude } = data;
    
    try {
      // Broadcast location to all connected clients
      io.emit('doctor:location:updated', {
        doctorId,
        latitude,
        longitude,
        timestamp: new Date()
      });

      // Save location to database
      const DoctorLocation = require('./models/DoctorLocation');
      await DoctorLocation.findOneAndUpdate(
        { doctorId },
        {
          doctorId,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          timestamp: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error updating doctor location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Patient tracking doctor
  // Emergency Alert
  socket.on('patient:emergency', async (data) => {
    const { patientId, patientName, location } = data;
    console.log(`🚨 Emergency Alert from ${patientName} (${patientId})`);
    
    // Save notification for all doctors
    try {
      const doctors = await User.find({ role: 'doctor' }).select('_id');
      console.log(`Found ${doctors.length} doctors to notify.`);
      
      for (const doctor of doctors) {
        await notificationController.createNotification({
          recipient: doctor._id,
          message: `🚨 EMERGENCY: Patient ${patientName} has triggered an SOS!`,
          type: 'emergency'
        });
      }
    } catch (error) {
      console.error('Error saving emergency notifications:', error);
    }

    // Broadcast to all connected clients (Doctors will filter this)
    io.emit('emergency:alert', {
      patientId,
      patientName,
      location,
      timestamp: new Date()
    });
  });

  // Doctor Response to Emergency
  socket.on('doctor:emergency:response', async (data) => {
    const { patientId, doctorName, status } = data;
    console.log(`👨‍⚕️ Doctor ${doctorName} responded to ${patientId}: ${status}`);
    
    // Save notification
    await notificationController.createNotification({
      recipient: patientId,
      message: `Doctor ${doctorName} is responding to your emergency!`,
      type: 'response'
    });
    
    // Broadcast back to everyone (Patient will filter by their ID)
    io.emit('emergency:response', {
      patientId,
      doctorName,
      status,
      timestamp: new Date()
    });
  });

  // Video Call Invite
  socket.on('video:call:start', async (data) => {
    const { recipientId, senderName, roomId } = data;
    
    // Save notification
    await notificationController.createNotification({
      recipient: recipientId,
      message: `Incoming Video Call from ${senderName}`,
      type: 'appointment'
    });

    io.emit('video:call:invite', {
      recipientId,
      senderName,
      roomId,
      timestamp: new Date()
    });
  });

  socket.on('patient:track:doctor', async (data) => {
    const { patientId, doctorId, patientLocation } = data;
    
    try {
      const DoctorLocation = require('./models/DoctorLocation');
      const doctorLocation = await DoctorLocation.findOne({ doctorId });

      if (doctorLocation) {
        // Calculate ETA using Haversine formula
        const { calculateDistance } = require('./utils/haversine');
        const distance = calculateDistance(
          patientLocation.latitude,
          patientLocation.longitude,
          doctorLocation.location.coordinates[1],
          doctorLocation.location.coordinates[0]
        );

        // Assume average speed of 40 km/h
        const eta = Math.round((distance / 40) * 60); // ETA in minutes

        socket.emit('eta:calculated', {
          doctorId,
          distance: distance.toFixed(2),
          eta,
          doctorLocation: {
            latitude: doctorLocation.location.coordinates[1],
            longitude: doctorLocation.location.coordinates[0]
          }
        });
      } else {
        socket.emit('error', { message: 'Doctor location not available' });
      }
    } catch (error) {
      console.error('Error calculating ETA:', error);
      socket.emit('error', { message: 'Failed to calculate ETA' });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket disconnected:', socket.id);
  });
});

// Start medicine reminder cron job (runs every minute to check)
cron.schedule('* * * * *', () => {
  cronService.checkMedicineReminders(io);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🏥 MediTrack AI Backend Server      ║
  ║   🚀 Running on port ${PORT}            ║
  ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}       ║
  ║   📡 WebSocket: Enabled                ║
  ╚════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = { app, io };
