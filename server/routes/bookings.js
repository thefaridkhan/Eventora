import express from 'express';
import {
    sendBookingOTP,
    bookEvent,
    confirmBooking,
    getMyBookings,
    cancelBooking
} from '../controllers/bookingController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// Booking Routes (User Protected)
// ==========================================

// @route   POST /api/bookings/send-otp
// @desc    Send verification OTP before booking
router.post('/send-otp', protect, sendBookingOTP);

// @route   POST /api/bookings
// @desc    Book an event after verifying OTP
router.post('/', protect, bookEvent);

// @route   GET /api/bookings/my
// @desc    Get user bookings (or all bookings if admin)
router.get('/my', protect, getMyBookings);

// @route   DELETE /api/bookings/:id
// @desc    Cancel a booking
router.delete('/:id', protect, cancelBooking);

// ==========================================
// Admin Booking Routes
// ==========================================

// @route   PUT /api/bookings/:id/confirm
// @desc    Admin confirms booking & marks payment
router.put('/:id/confirm', protect, admin, confirmBooking);

export default router;
