const AppError = require('./app-error');
const { StatusCodes } = require('http-status-codes');

class ValidationError extends AppError {
  constructor(message, explanation) {
    super(
      'ValidationError',
      message || 'Not able to validate the data sent in the request',
      explanation || 'Invalid request payload',
      StatusCodes.BAD_REQUEST
    );
  }
}

module.exports = ValidationError;
