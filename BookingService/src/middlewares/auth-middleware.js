const jwt = require('jsonwebtoken');
const { JWT_KEY } = require('../config/serverConfig');
const { AppError } = require('../utils/errors');
const { StatusCodes } = require('http-status-codes');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 'Authorization header missing or invalid', 'A valid Bearer token is required', StatusCodes.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Unauthorized', 'Token missing', 'A valid Bearer token is required', StatusCodes.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, JWT_KEY);
    req.user = decoded;
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

    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Invalid or expired token',
      explanation: 'The supplied token could not be verified',
      data: {},
      success: false,
      err: {}
    });
  }
};

module.exports = verifyToken;
