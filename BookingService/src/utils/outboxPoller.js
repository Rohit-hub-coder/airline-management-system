const { Op } = require('sequelize');
const { Outbox } = require('../models');
const { publishMessage } = require('./messageQueue');

const pollOutbox = async () => {
  try {
    const pendingMessages = await Outbox.findAll({
      where: { status: 'Pending' }
    });

    for (const message of pendingMessages) {
      await publishMessage(message.payload, message.eventType);
      await message.update({ status: 'Sent' });
    }
  } catch (error) {
    console.error('Outbox poller failed', error);
  }
};

const startOutboxPoller = (intervalMs = 5000) => {
  setInterval(() => {
    pollOutbox();
  }, intervalMs);
};

module.exports = {
  pollOutbox,
  startOutboxPoller
};
