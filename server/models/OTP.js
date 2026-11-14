import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required for OTP'],
            trim: true,
            lowercase: true
        },

        otp: {
            type: String,
            required: [true, 'OTP value is required'],
            trim: true
        },

        action: {
            type: String,
            enum: ['account_verification', 'event_booking'],
            required: [true, 'OTP action type is required']
        },

        createdAt: {
            type: Date,
            default: Date.now,
            expires: 300 // OTP expires automatically after 5 minutes (300 seconds)
        }
    }
);

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
