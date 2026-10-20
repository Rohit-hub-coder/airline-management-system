const express = require('express');
const router = express.Router();

const v1Routes = require('./v1/index');

router.get('/health', (req, res) => {
  return res.status(200).json({
    message: 'OK',
    data: {},
    success: true,
    err: {}
  });
});

router.get('/ready', async (req, res) => {
  try {
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    return res.status(200).json({
      message: 'Database connection is alive',
      data: {},
      success: true,
      err: {}
    });
  } catch (error) {
    return res.status(503).json({
      message: 'Database connection unavailable',
      data: {},
      success: false,
      err: {}
    });
  }
});

router.use('/v1', v1Routes);

module.exports = router;
