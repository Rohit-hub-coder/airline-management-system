const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 3002,
  JWT_KEY: process.env.JWT_KEY || 'booking_service_jwt_secret',
  FLIGHT_SERVICE_PATH: process.env.FLIGHT_SERVICE_PATH || 'http://localhost:3001/api/v1/flights'
  ,
  MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL || 'amqp://localhost',
  EXCHANGE_NAME: process.env.EXCHANGE_NAME || 'BOOKING_SERVICE'
};
