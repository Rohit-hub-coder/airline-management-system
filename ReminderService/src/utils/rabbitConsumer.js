const amqp = require('amqplib');
const { MESSAGE_BROKER_URL, EXCHANGE_NAME } = require('../config/serverConfig');
const { Notification } = require('../models');

let connection = null;
let channel = null;

async function startConsumer() {
  try {
    connection = await amqp.connect(MESSAGE_BROKER_URL);
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err && err.message);
    });
    connection.on('close', () => {
      console.warn('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    const queue = 'REMINDER_QUEUE';
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, EXCHANGE_NAME, 'booking.created');

    console.log(`RabbitMQ consumer bound to exchange ${EXCHANGE_NAME} with routing key booking.created`);

    await channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        let payload = JSON.parse(msg.content.toString());
        if (typeof payload === 'string') {
          payload = JSON.parse(payload);
        }

        const existingNotification = await Notification.findOne({
          where: {
            bookingId: payload.bookingId,
            status: payload.status
          }
        });

        if (!existingNotification) {
          await Notification.create({
            bookingId: payload.bookingId,
            userId: payload.userId,
            status: payload.status,
            notificationStatus: 'Pending',
            message: `Booking event received for booking ${payload.bookingId}`
          });
        }
        channel.ack(msg);
      } catch (error) {
        console.error('Failed to process reminder message', error);
        // leave message unacked so it can be retried
      }
    }, { noAck: false });
  } catch (error) {
    console.error('Failed to start RabbitMQ consumer', error);
  }
}

module.exports = {
  startConsumer
};
