const jwt = require('jsonwebtoken');
const { JWT_KEY } = require('../config/serverConfig');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      message: 'Authorization header missing',
      data: {},
      success: false,
      err: {}
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Token missing',
      data: {},
      success: false,
      err: {}
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token',
      data: {},
      success: false,
      err: {}
    });
  }
};

module.exports = verifyToken;