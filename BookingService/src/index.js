const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { PORT } = require('./config/serverConfig');
const apiRoutes = require('./routes');
const { startOutboxPoller } = require('./utils/outboxPoller');

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', apiRoutes);
app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }));
startOutboxPoller();

app.listen(PORT, () => {
  console.log(`Booking Service listening on port ${PORT}`);
});

module.exports = app;