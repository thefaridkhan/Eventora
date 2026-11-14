import express from 'express';
import { register, login, verifyOTP } from '../controllers/authController.js';

const router = express.Router();

// ==========================================
// Authentication Routes
// ==========================================

// @route   POST /api/auth/register
// @desc    Register new user & send account verification OTP
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get JWT token
router.post('/login', login);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and activate account
router.post('/verify-otp', verifyOTP);

export default router;
