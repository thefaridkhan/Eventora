import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required']
        },

        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event reference is required']
        },

        status: {
            type: String,
            enum: ['confirmed', 'cancelled', 'pending'],
            default: 'pending'
        },

        paymentStatus: {
            type: String,
            enum: ['paid', 'not_paid'],
            default: 'not_paid'
        },

        amount: {
            type: Number,
            required: [true, 'Booking amount is required'],
            min: [0, 'Amount cannot be negative']
        },

        bookedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
