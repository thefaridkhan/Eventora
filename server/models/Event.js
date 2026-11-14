import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true
        },

        description: {
            type: String,
            required: [true, 'Event description is required'],
            trim: true
        },

        date: {
            type: Date,
            required: [true, 'Event date and time is required']
        },

        location: {
            type: String,
            required: [true, 'Event location is required'],
            trim: true
        },

        category: {
            type: String,
            required: [true, 'Event category is required'],
            trim: true
        },

        totalSeats: {
            type: Number,
            required: [true, 'Total seats count is required'],
            min: [1, 'Total seats must be at least 1']
        },

        availableSeats: {
            type: Number,
            required: [true, 'Available seats count is required'],
            min: [0, 'Available seats cannot be negative']
        },

        ticketPrice: {
            type: Number,
            required: [true, 'Ticket price is required'],
            default: 0,
            min: [0, 'Ticket price cannot be negative']
        },

        image: {
            type: String,
            default: '',
            trim: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;
