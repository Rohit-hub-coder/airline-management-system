const nodemailer = require('nodemailer');

let transporter;

const initTransporter = async () => {
    if (!transporter) {
        // Generate test SMTP service account from ethereal.email
        const testAccount = await nodemailer.createTestAccount();

        // create reusable transporter object using the default SMTP transport
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
    }
    return transporter;
};

const sendNotification = async (notification) => {
    try {
        const mailer = await initTransporter();

        const info = await mailer.sendMail({
            from: '"Airline System" <noreply@airline.com>',
            to: `user_${notification.userId || 'unknown'}@example.com`,
            subject: `Booking Confirmation: ${notification.bookingId || 'Unknown'}`,
            text: `Hello, your booking ${notification.bookingId || ''} status is confirmed. Details: ${notification.message}`,
            html: `<b>Hello</b>,<br>Your booking <b>${notification.bookingId || ''}</b> status is confirmed.<br><p>${notification.message}</p>`,
        });

        console.log(`[Ethereal Email] Sent to user ${notification.userId}. Preview URL: %s`, nodemailer.getTestMessageUrl(info));
        return true; // Used by poller to mark as sent
    } catch (error) {
        console.error('Error sending Ethereal email:', error);
        return false;
    }
};

module.exports = {
  sendNotification
};
