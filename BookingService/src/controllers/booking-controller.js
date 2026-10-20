const { StatusCodes } = require('http-status-codes');
const BookingService = require('../services/booking-service');
const bookingService = new BookingService();

const createBooking = async (req, res) => {
  try {
    const response = await bookingService.createBooking({
      userId: req.user.id,
      flightId: req.body.flightId,
      noOfSeats: req.body.noOfSeats
    });
    return res.status(StatusCodes.CREATED).json({
      message: 'Booking created successfully',
      data: response,
      success: true,
      err: {}
    });
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
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      data: {},
      success: false,
      err: {}
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const response = await bookingService.getBookings(req.user.id, req.query);
    return res.status(StatusCodes.OK).json({
      message: 'Bookings fetched successfully',
      data: response,
      success: true,
      err: {}
    });
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
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      data: {},
      success: false,
      err: {}
    });
  }
};

const getBooking = async (req, res) => {
  try {
    const response = await bookingService.getBooking(req.user.id, req.params.id);
    return res.status(StatusCodes.OK).json({
      message: 'Booking fetched successfully',
      data: response,
      success: true,
      err: {}
    });
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
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      data: {},
      success: false,
      err: {}
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const response = await bookingService.cancelBooking(req.user.id, req.params.id);
    return res.status(StatusCodes.OK).json({
      message: 'Booking cancelled successfully',
      data: response,
      success: true,
      err: {}
    });
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
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      data: {},
      success: false,
      err: {}
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  cancelBooking
};