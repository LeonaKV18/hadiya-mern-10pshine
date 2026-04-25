const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP credentials from .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send verification email with a clickable link containing the token
const sendVerificationEmail = async (toEmail, token) => {
  const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"PlumPad" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: 'Verify your PlumPad account',
    html: `
      <p>Thank you for registering with PlumPad!</p>
      <p>Click the link below to verify your email address and activate your account:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you did not register using this address, please ignore this email.</p>
    `,
  });
};

module.exports = { sendVerificationEmail };