import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const jwtSecret = process.env.JWT_SECRET || 'eventsystem-dev-secret';

// ==========================================
// Authentication Middleware
// ==========================================

/**
 * @desc Protect routes - verifies Bearer JWT token and attaches user to req
 */
export const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);

        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        return next();

    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
    }
};

/**
 * @desc Admin authorization check
 */
export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    return res.status(403).json({ message: 'Forbidden: Admin access required' });
};
