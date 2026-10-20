const express = require('express');
const bodyParser = require('body-parser');
const { PORT } = require('./config/serverConfig');
const apiRoutes = require('./routes');
const { startNotificationPoller } = require('./utils/notificationPoller');
const { startConsumer } = require('./utils/rabbitConsumer');

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', apiRoutes);
app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }));

startConsumer();
startNotificationPoller();

app.listen(PORT, () => {
  console.log(`Reminder Service listening on port ${PORT}`);
});

module.exports = app;
