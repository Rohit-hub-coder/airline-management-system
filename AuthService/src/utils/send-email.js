const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Verify your email - OTP',
    html: `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 10 minutes.</p>`
  });
};

module.exports = sendOTPEmail;