const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'your-api-key');

exports.sendEmail = async ({ to, subject, text, html }) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'noreply@meditrack.com',
      subject,
      text,
      html: html || text
    };

    if (process.env.NODE_ENV === 'production') {
      await sgMail.send(msg);
      console.log(`Email sent to ${to}`);
    } else {
      console.log('📧 Email (Dev Mode):', { to, subject, text });
    }

    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};