const Medicine = require('../models/Medicine');
const User = require('../models/User');
const { sendSMS } = require('./smsService');
const { sendEmail } = require('./emailService');

exports.checkMedicineReminders = async (io) => {
  try {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find all active medicines with reminders enabled
    const medicines = await Medicine.find({
      active: true,
      reminderEnabled: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('patient');

    for (const medicine of medicines) {
      // Check if current time matches any of the medicine timings
      if (medicine.timings.includes(currentTime)) {
        // Check if reminder already sent today at this time
        const today = new Date().setHours(0, 0, 0, 0);
        const alreadySent = medicine.adherence.some(a => {
          const adherenceDate = new Date(a.date).setHours(0, 0, 0, 0);
          return adherenceDate === today && a.time === currentTime;
        });

        if (!alreadySent) {
          const patient = medicine.patient;
          const message = `⏰ Medicine Reminder: Time to take ${medicine.name} (${medicine.dosage}). ${medicine.instructions || ''}`;

          // Send SMS
          await sendSMS({
            to: patient.phone,
            message
          });

          // Send Email
          await sendEmail({
            to: patient.email,
            subject: 'Medicine Reminder - MediTrack AI',
            text: message
          });

          // Emit WebSocket event
          if (io) {
            io.emit(`medicine:reminder:${patient._id}`, {
              medicineId: medicine._id,
              name: medicine.name,
              dosage: medicine.dosage,
              time: currentTime
            });
          }

          console.log(`✅ Reminder sent for ${medicine.name} to ${patient.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
};