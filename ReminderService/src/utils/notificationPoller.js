const { Notification } = require('../models');
const NotificationService = require('../services/notification-service');

const pollPendingNotifications = async () => {
  try {
    const pendingNotifications = await Notification.findAll({
      where: { notificationStatus: 'Pending' }
    });

    for (const notification of pendingNotifications) {
      try {
        const sent = await NotificationService.sendNotification(notification);
        if (sent) {
          await notification.update({ notificationStatus: 'Sent' });
        } else {
          await notification.update({ notificationStatus: 'Failed' });
        }
      } catch (error) {
        console.error('Notification send failed', error);
        await notification.update({ notificationStatus: 'Failed' });
      }
    }
  } catch (error) {
    console.error('Notification poller failed', error);
  }
};

const startNotificationPoller = (intervalMs = 15000) => {
  setInterval(() => {
    pollPendingNotifications();
  }, intervalMs);
};

module.exports = {
  pollPendingNotifications,
  startNotificationPoller
};
