const nodemailer = require('nodemailer');

let transporter;

const getMissingOrPlaceholderVars = () => {
  const checks = [
    ['SMTP_HOST', process.env.SMTP_HOST],
    ['SMTP_USER', process.env.SMTP_USER],
    ['SMTP_PASS', process.env.SMTP_PASS],
  ];

  return checks
    .filter(([, value]) => {
      const normalized = String(value || '').trim().toLowerCase();
      return (
        !normalized ||
        normalized.includes('your_email') ||
        normalized.includes('your_app_password')
      );
    })
    .map(([key]) => key);
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const missing = getMissingOrPlaceholderVars();
  if (missing.length > 0) {
    return {
      sent: false,
      reason: `SMTP is not configured. Missing or placeholder: ${missing.join(', ')}`,
    };
  }

  const client = getTransporter();

  if (!client) {
    return {
      sent: false,
      reason: 'SMTP transport could not be initialized',
    };
  }

  try {
    await client.sendMail({
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'lynnmuthoni00@gmail.com',
      to,
      subject,
      text,
      html,
    });

    return { sent: true };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return {
      sent: false,
      reason: error.message,
    };
  }
};

module.exports = {
  sendEmail,
};
