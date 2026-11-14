import Event from '../models/Event.js';

// ==========================================
// Event Controllers
// ==========================================

/**
 * @desc    Fetch all events with optional category and search filters
 * @route   GET /api/events
 */
export const getEvents = async (req, res) => {
    try {
        const filters = {};

        if (req.query.category) {
            filters.category = req.query.category;
        }

        if (req.query.search) {
            filters.title = { $regex: req.query.search, $options: 'i' };
        }

        const events = await Event.find(filters)
            .populate('createdBy', 'name email')
            .sort({ date: 1 });

        return res.status(200).json(events);

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error fetching events',
            error: error.message
        });
    }
};

/**
 * @desc    Fetch a single event by ID
 * @route   GET /api/events/:id
 */
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.status(200).json(event);

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error fetching event details',
            error: error.message
        });
    }
};

/**
 * @desc    Create a new event (Admin only)
 * @route   POST /api/events
 */
export const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            ticketPrice,
            image
        } = req.body;

        const event = await Event.create({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: totalSeats,
            ticketPrice: ticketPrice || 0,
            image: image || '',
            createdBy: req.user.id
        });

        return res.status(201).json(event);

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error creating event',
            error: error.message
        });
    }
};

/**
 * @desc    Update an existing event (Admin only)
 * @route   PUT /api/events/:id
 */
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.status(200).json(event);

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error updating event',
            error: error.message
        });
    }
};

/**
 * @desc    Delete an event (Admin only)
 * @route   DELETE /api/events/:id
 */
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.status(200).json({ message: 'Event deleted successfully' });

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error deleting event',
            error: error.message
        });
    }
};
