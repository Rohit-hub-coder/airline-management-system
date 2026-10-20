class AppError extends Error {
  constructor(name, message, explanation, statusCode) {
    super(message);
    this.name = name;
    this.explanation = explanation;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;