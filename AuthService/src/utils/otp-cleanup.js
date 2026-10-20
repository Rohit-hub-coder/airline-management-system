const cron = require('node-cron');
const { User } = require('../models');
const { Op } = require('sequelize');

const startOTPCleanupJob = () => {
  // Runs every hour, at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await User.update(
        { otp: null, otpExpiry: null },
        {
          where: {
            otpExpiry: { [Op.lt]: new Date() },
            otp: { [Op.ne]: null }
          }
        }
      );
      console.log(`OTP Cleanup: ${result[0]} expired OTP(s) cleared`);
    } catch (error) {
      console.log('Error during OTP cleanup job:', error.message);
    }
  });

  console.log('OTP cleanup cron job scheduled (runs every hour)');
};

module.exports = startOTPCleanupJob;