import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail } from '../utils/email.js';

// ==========================================
// Helper Utilities
// ==========================================
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET || 'eventsystem-dev-secret',
        { expiresIn: '30d' }
    );
};

// ==========================================
// Controllers
// ==========================================

/**
 * @desc    Register a new user and dispatch OTP
 * @route   POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // 1. Pehle user check karein
        const existingUser = await User.findOne({ email });
        // 2. Agar user pehle se hai AUR verified bhi hai, tabhi block karein
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        // 3. Password hash karein
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        let user;
        if (existingUser && !existingUser.isVerified) {
            // Agar pehle se hai lekin unverified hai, to purana record hi update kar dein
            existingUser.name = name;
            existingUser.password = hashedPassword;
            user = await existingUser.save();
        } else {
            // Naya unverified user create karein
            user = await User.create({
                name,
                email,
                password: hashedPassword,
                role: 'user',
                isVerified: false
            });
        }
        // 4. Naya OTP generate karein
        const otp = generateOTP();
        // Agar is email ka koi purana OTP pada ho to use delete karein
        await OTP.deleteMany({
            email,
            action: 'account_verification'
        });
        // Naya OTP database me save karein
        await OTP.create({
            email,
            otp,
            action: 'account_verification'
        });
        // 5. OTP email bhejein
        try {
            await sendOTPEmail(email, otp, 'account_verification');
        } catch (emailError) {
            console.error('Email dispatch error:', emailError);
            return res.status(500).json({
                message: 'Failed to send OTP email. Please check email settings or try again.'
            });
        }
        return res.status(201).json({
            message: 'OTP sent to email. Please verify your account.',
            email: user.email
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Server Error during registration',
            error: error.message
        });
    }
};

/**
 * @desc    Authenticate user credentials & issue JWT
 * @route   POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if email is verified (admins can bypass)
        if (!user.isVerified && user.role !== 'admin') {
            const otp = generateOTP();

            await OTP.findOneAndDelete({ email: user.email, action: 'account_verification' });

            await OTP.create({
                email: user.email,
                otp,
                action: 'account_verification'
            });

            await sendOTPEmail(user.email, otp, 'account_verification');

            return res.status(403).json({
                message: 'Account not verified. A new OTP has been sent.',
                needsVerification: true,
                email: user.email
            });
        }

        return res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error during login',
            error: error.message
        });
    }
};

/**
 * @desc    Verify registration OTP and activate user account
 * @route   POST /api/auth/verify-otp
 */
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate OTP from database
        const validOTP = await OTP.findOne({
            email,
            otp,
            action: 'account_verification'
        });

        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Update user verification status
        const user = await User.findOneAndUpdate(
            { email },
            { isVerified: true },
            { returnDocument: 'after' }
        );

        // Delete consumed OTP
        await OTP.deleteOne({ _id: validOTP._id });

        return res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Server Error during OTP verification',
            error: error.message
        });
    }
};
