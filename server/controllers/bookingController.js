import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import OTP from '../models/OTP.js';
import { sendBookingEmail, sendOTPEmail } from '../utils/email.js';

// ==========================================
// Helper Utilities
// ==========================================
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==========================================
// Booking Controllers
// ==========================================

/**
 * @desc    Send verification OTP before allowing a user to book an event
 * @route   POST /api/bookings/send-otp
 */
export const sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();

        await OTP.findOneAndDelete({
            email: req.user.email,
            action: 'event_booking'
        });

        await OTP.create({
            email: req.user.email,
            otp,
            action: 'event_booking'
        });

        await sendOTPEmail(req.user.email, otp, 'event_booking');

        return res.status(200).json({ message: 'OTP sent successfully to your email.' });

    } catch (error) {
        return res.status(500).json({
            message: 'Error sending booking OTP',
            error: error.message
        });
    }
};

/**
 * @desc    Submit an event booking with OTP verification
 * @route   POST /api/bookings
 */
export const bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        // 1. Verify OTP
        const validOTP = await OTP.findOne({
            email: req.user.email,
            otp,
            action: 'event_booking'
        });

        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        // 2. Verify Event existence and seat availability
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available for this event' });
        }

        // 3. Prevent duplicate active bookings
        const existingBooking = await Booking.findOne({
            userId: req.user.id,
            eventId
        });

        if (existingBooking && existingBooking.status !== 'cancelled') {
            return res.status(400).json({ message: 'You already have an active or pending booking for this event' });
        }

        // 4. Create booking request (pending admin confirmation)
        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'pending',
            paymentStatus: 'not_paid',
            amount: event.ticketPrice
        });

        // 5. Cleanup OTP
        await OTP.deleteOne({ _id: validOTP._id });

        return res.status(201).json({
            message: 'Booking request submitted successfully! Awaiting admin confirmation.',
            booking
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error creating booking',
            error: error.message
        });
    }
};

/**
 * @desc    Confirm booking & optionally update payment status (Admin only)
 * @route   PUT /api/bookings/:id/confirm
 */
export const confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body; // 'paid' | 'not_paid'

        const booking = await Booking.findById(req.params.id)
            .populate('userId')
            .populate('eventId');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status === 'confirmed') {
            return res.status(400).json({ message: 'Booking is already confirmed' });
        }

        const event = await Event.findById(booking.eventId._id);
        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        // Update booking state
        booking.status = 'confirmed';
        if (paymentStatus) {
            booking.paymentStatus = paymentStatus;
        }
        await booking.save();

        // Decrement available seat count
        event.availableSeats -= 1;
        await event.save();

        // Dispatch confirmation email
        await sendBookingEmail(
            booking.userId.email,
            booking.userId.name,
            booking.eventId.title,
            booking.eventId.date ? new Date(booking.eventId.date).toLocaleDateString() : '',
            booking.eventId.location || '',
            booking.amount || 0
        );

        return res.status(200).json({
            message: 'Booking confirmed successfully and confirmation email sent.',
            booking
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error confirming booking',
            error: error.message
        });
    }
};

/**
 * @desc    Get user bookings (or all system bookings if user is admin)
 * @route   GET /api/bookings/my
 */
export const getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find()
                .populate('eventId')
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id })
                .populate('eventId')
                .sort({ createdAt: -1 });

        return res.status(200).json(bookings);

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error fetching bookings',
            error: error.message
        });
    }
};

/**
 * @desc    Cancel a booking and release reserved seat if confirmed
 * @route   DELETE /api/bookings/:id
 */
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        const wasConfirmed = booking.status === 'confirmed';

        booking.status = 'cancelled';
        await booking.save();

        // Only restore available seat if it was previously confirmed
        if (wasConfirmed) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += 1;
                await event.save();
            }
        }

        return res.status(200).json({ message: 'Booking cancelled successfully.' });

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error cancelling booking',
            error: error.message
        });
    }
};
