import express from 'express';
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} from '../controllers/eventController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// Public Event Routes
// ==========================================

// @route   GET /api/events
// @desc    Get all events (supports ?search= and ?category= filters)
router.get('/', getEvents);

// @route   GET /api/events/:id
// @desc    Get single event by ID
router.get('/:id', getEventById);

// ==========================================
// Admin Protected Event Routes
// ==========================================

// @route   POST /api/events
// @desc    Create a new event
router.post('/', protect, admin, createEvent);

// @route   PUT /api/events/:id
// @desc    Update an existing event
router.put('/:id', protect, admin, updateEvent);

// @route   DELETE /api/events/:id
// @desc    Delete an event
router.delete('/:id', protect, admin, deleteEvent);

export default router;
