const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/booking-controller');
const verifyToken = require('../../middlewares/auth-middleware');
const validateBooking = require('../../middlewares/validate-booking');

router.get('/bookings', verifyToken, bookingController.getBookings);
router.get('/bookings/:id', verifyToken, bookingController.getBooking);
router.patch('/bookings/:id/cancel', verifyToken, bookingController.cancelBooking);
router.post('/bookings', verifyToken, validateBooking, bookingController.createBooking);

module.exports = router;
