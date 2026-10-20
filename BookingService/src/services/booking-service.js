const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { AppError } = require('../utils/errors');
const { FLIGHT_SERVICE_PATH } = require('../config/serverConfig');
const BookingRepository = require('../repository/booking-repository');
const PaymentService = require('./payment-service');
const { Outbox, sequelize } = require('../models');

class BookingService {
  constructor() {
    this.bookingRepository = new BookingRepository();
    this.paymentService = new PaymentService();
  }
  async createBooking(bookingData) {
    const booking = {
      status: 'In Process',
      ...bookingData
    };

    try {
      const flightResponse = await axios.get(`${FLIGHT_SERVICE_PATH}/${bookingData.flightId}`);
      const flightData = flightResponse.data?.data || flightResponse.data;
      const normalizedFlightData = flightData && typeof flightData === 'object' ? flightData : null;

      if (!normalizedFlightData) {
        throw new AppError('Flight availability could not be verified', 'The flight service returned an unexpected payload', 'The flight service must return a flight object with explicit seat data to continue', StatusCodes.SERVICE_UNAVAILABLE);
      }

      const hasExplicitSeatCount = Object.prototype.hasOwnProperty.call(normalizedFlightData, 'totalSeats') || Object.prototype.hasOwnProperty.call(normalizedFlightData, 'availableSeats');
      const rawSeatCount = normalizedFlightData.totalSeats ?? normalizedFlightData.availableSeats;
      const availableSeats = Number(rawSeatCount);

      if (!hasExplicitSeatCount || !Number.isFinite(availableSeats)) {
        throw new AppError('Flight availability could not be verified', 'The flight service did not provide a usable seat count', 'The flight service must return an explicit totalSeats or availableSeats value', StatusCodes.SERVICE_UNAVAILABLE);
      }

      if (availableSeats < Number(bookingData.noOfSeats)) {
        throw new AppError('Insufficient seats', 'Not enough seats are available for this booking', 'Please reduce the number of seats requested', StatusCodes.CONFLICT);
      }

      booking.totalCost = Number(normalizedFlightData.price || 0) * Number(bookingData.noOfSeats);

      try {
        await axios.patch(`${FLIGHT_SERVICE_PATH}/${bookingData.flightId}`, {
          decrementSeats: Number(bookingData.noOfSeats),
          reserveIfAvailable: true,
          reason: 'booking-reservation'
        });

        booking.status = 'Pending Payment';
        const paymentResult = await this.paymentService.processPayment(booking.totalCost);
        if (!paymentResult.success) {
          booking.status = 'Cancelled';
          throw new AppError('Payment failed', 'The payment step failed and the booking was cancelled', 'Payment gateway integration is not yet complete', StatusCodes.PAYMENT_REQUIRED);
        }

        booking.status = 'Booked';
        const createdBooking = await sequelize.transaction(async (t) => {
          const newBooking = await this.bookingRepository.create(booking, { transaction: t });
          await Outbox.create({
            eventType: 'booking.created',
            payload: JSON.stringify({ bookingId: newBooking.id, userId: newBooking.userId, status: newBooking.status }),
            status: 'Pending'
          }, { transaction: t });
          return newBooking;
        });
        return createdBooking;
      } catch (error) {
        if (error.isOperational) {
          throw error;
        }

        booking.status = 'Cancelled';
        throw new AppError(
          'Seat reservation failed',
          'The flight seat reservation could not be completed, so the booking was cancelled',
          'FlightsAndSearch must expose an atomic conditional decrement endpoint for reservation-safe seat updates',
          StatusCodes.CONFLICT
        );
      }
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      throw new AppError(
        'Booking creation failed',
        'Unable to create the booking at this time',
        error.message || 'Unexpected booking service error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getBookings(userId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const status = query.status;

    return this.bookingRepository.findAllByUser(userId, { page, limit, status });
  }

  async getBooking(userId, bookingId) {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new AppError('Booking not found', 'The requested booking could not be found', 'Please check the booking id', StatusCodes.NOT_FOUND);
    }

    if (booking.userId !== Number(userId)) {
      throw new AppError('Forbidden', 'You are not allowed to access this booking', 'Bookings are scoped to the authenticated user', StatusCodes.FORBIDDEN);
    }

    return booking;
  }

  async cancelBooking(userId, bookingId) {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new AppError('Booking not found', 'The requested booking could not be found', 'Please check the booking id', StatusCodes.NOT_FOUND);
    }

    if (booking.userId !== Number(userId)) {
      throw new AppError('Forbidden', 'You are not allowed to cancel this booking', 'Bookings are scoped to the authenticated user', StatusCodes.FORBIDDEN);
    }

    try {
      await axios.patch(`${FLIGHT_SERVICE_PATH}/${booking.flightId}`, {
        incrementSeats: Number(booking.noOfSeats),
        reason: 'booking-cancel'
      });

      return this.bookingRepository.updateById(bookingId, { status: 'Cancelled' });
    } catch (error) {
      throw new AppError(
        'Seat release failed',
        'The booking could not be cancelled because the flight seat release failed',
        error.message || 'Unable to restore seats for the cancelled booking',
        StatusCodes.CONFLICT
      );
    }
  }
}

module.exports = BookingService;
