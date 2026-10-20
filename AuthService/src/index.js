const express = require('express');
require('dotenv').config();
const apiRoutes = require('./routes/index');
const bodyParser = require('body-parser');
const startOTPCleanupJob = require('./utils/otp-cleanup');
const db = require('./models/index');

const app = express();
app.use(bodyParser.json());

const prepareAndStartServer = async () => {
    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use('/api', apiRoutes);
    app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }));
}

prepareAndStartServer().then(() => {
    app.listen(process.env.PORT, async () => {
        console.log(`Auth Service listening on port ${process.env.PORT}`);
        startOTPCleanupJob();
        
        if (process.env.DB_SYNC === 'true') {
            await db.sequelize.sync({ alter: true });
            console.log('Database synced');
        }
    });
});