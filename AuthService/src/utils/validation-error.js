const AppError = require('./error-handler');
const { StatusCodes } = require('http-status-codes');

class ValidationError extends AppError {
  constructor(error) {
    const explanation = [];
    error.errors.forEach((err) => {
      explanation.push(err.message);
    });

    super(
      'ValidationError',
      'Not able to validate the data sent in the request',
      explanation.join(', '),
      StatusCodes.BAD_REQUEST
    );
  }
}

module.exports = ValidationError;