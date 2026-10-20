const amqp = require('amqplib');
const { MESSAGE_BROKER_URL, EXCHANGE_NAME } = require('../config/serverConfig');

let connection = null;
let channel = null;
let channelPromise = null;

async function createChannel() {
  if (channel) return channel;
  if (channelPromise) return channelPromise;

  channelPromise = (async () => {
    try {
      connection = await amqp.connect(MESSAGE_BROKER_URL);
      connection.on('error', (err) => {
        // let publishes fail fast if connection has error
        console.error('RabbitMQ connection error:', err && err.message);
      });
      connection.on('close', () => {
        console.warn('RabbitMQ connection closed');
        channel = null;
        channelPromise = null;
        connection = null;
      });

      const ch = await connection.createChannel();
      await ch.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
      channel = ch;
      return channel;
    } catch (err) {
      channelPromise = null;
      // ensure connection is cleaned up on failure
      try { if (connection) await connection.close(); } catch (e) {}
      connection = null;
      throw err;
    }
  })();

  return channelPromise;
}

/**
 * Publish a JSON payload to the configured exchange.
 *
 * Throws/rejects if the broker is unreachable or publish fails.
 * Keeps a single channel open and reuses it for subsequent publishes.
 */
async function publishMessage(payload, routingKey = '') {
  const ch = await createChannel();
  if (!ch) throw new Error('Unable to create RabbitMQ channel');

  const content = Buffer.from(JSON.stringify(payload));
  const ok = ch.publish(EXCHANGE_NAME, routingKey, content, { persistent: true });

  if (!ok) {
    // channel.publish returns false when internal buffer is full; wait for drain
    await new Promise((resolve, reject) => {
      ch.once('drain', resolve);
      // add a timeout to avoid hanging forever
      setTimeout(() => reject(new Error('Timed out waiting for channel drain')), 5000);
    });
  }

  return true;
}

process.on('exit', async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (e) {}
});

module.exports = {
  publishMessage
};
