const twilio = require('twilio');

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

exports.sendSMS = async ({ to, message }) => {
  try {
    if (process.env.NODE_ENV === 'production' && client) {
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      console.log(`SMS sent to ${to}: ${result.sid}`);
    } else {
      console.log('📱 SMS (Dev Mode):', { to, message });
    }

    return { success: true };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: error.message };
  }
};