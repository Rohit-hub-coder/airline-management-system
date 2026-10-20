const UserService = require('../services/user-service');
const ValidationError = require('../utils/validation-error');
const { StatusCodes } = require('http-status-codes');

const userService = new UserService();

const create = async (req, res) => {
  try {
    const response = await userService.createUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    });
    return res.status(StatusCodes.CREATED).json({
      message: 'Successfully created a user. Please check your email for OTP verification.',
      data: response,
      success: true,
      err: {}
    });
  } catch (error) {
    console.log(error);
    if (error.name === 'SequelizeValidationError') {
      const validationError = new ValidationError(error);
      return res.status(validationError.statusCode).json({
        message: validationError.message,
        explanation: validationError.explanation,
        data: {},
        success: false,
        err: {}
      });
    }
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        message: error.message,
        explanation: error.explanation,
        data: {},
        success: false,
        err: {}
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      data: {},
      success: false,
      err: error
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const response = await userService.verifyOTP(req.body.email, req.body.otp);
    return res.status(StatusCodes.OK).json({
      message: 'Email verified successfully',
      data: response,
      success: true,
      err: {}
    });
  } catch (error) {
    console.log(error);
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        message: error.message,
        explanation: error.explanation,
        data: {},
        success: false,
        err: {}
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      data: {},
      success: false,
      err: {}
    });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await userService.signIn(email, password);
    return res.status(StatusCodes.OK).json({
      message: 'Signed in successfully',
      data: { token },
      success: true,
      err: {}
    });
  } catch (error) {
    console.log(error);
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        message: error.message,
        explanation: error.explanation,
        data: {},
        success: false,
        err: {}
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      data: {},
      success: false,
      err: {}
    });
  }
};

const getProfile = async (req, res) => {
  return res.status(StatusCodes.OK).json({
    message: 'Profile fetched successfully',
    data: req.user,
    success: true,
    err: {}
  });
};

const assignRole = async (req, res) => {
  try {
    const response = await userService.assignRole(req.body.userId, req.body.roleId);
    return res.status(StatusCodes.OK).json({
      message: 'Role assigned successfully',
      data: response,
      success: true,
      err: {}
    });
  } catch (error) {
    console.log(error);
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        message: error.message,
        explanation: error.explanation,
        data: {},
        success: false,
        err: {}
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      data: {},
      success: false,
      err: {}
    });
  }
};

module.exports = {
  create,
  verifyOTP,
  signIn,
  getProfile,
  assignRole
};