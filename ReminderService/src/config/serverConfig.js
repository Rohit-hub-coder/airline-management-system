const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 3003,
  MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL || 'amqp://localhost',
  EXCHANGE_NAME: process.env.EXCHANGE_NAME || 'BOOKING_SERVICE',
  DB_USERNAME: process.env.DB_USERNAME || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_NAME: process.env.DB_NAME || 'reminder_db_dev',
  DB_HOST: process.env.DB_HOST || '127.0.0.1'
};
