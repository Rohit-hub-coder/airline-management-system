const { ValidationError } = require('../utils/errors');

const validateBooking = (req, res, next) => {
  try {
    const { flightId, noOfSeats } = req.body;

    if (!Number.isInteger(Number(flightId)) || Number(flightId) <= 0) {
      throw new ValidationError('Invalid flightId', 'flightId must be a positive integer');
    }

    if (!Number.isInteger(Number(noOfSeats)) || Number(noOfSeats) <= 0 || Number(noOfSeats) > 10) {
      throw new ValidationError('Invalid noOfSeats', 'noOfSeats must be a positive integer between 1 and 10');
    }

    next();
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        message: error.message,
        explanation: error.explanation,
        data: {},
        success: false,
        err: {}
      });
    }

    return res.status(500).json({
      message: 'Internal Server Error',
      data: {},
      success: false,
      err: {}
    });
  }
};

module.exports = validateBooking;
