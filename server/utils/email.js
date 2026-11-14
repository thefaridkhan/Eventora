
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async ({ to, subject, html, text }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
        throw new Error('BREVO_API_KEY and BREVO_SENDER_EMAIL must be configured');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'EventSystem', email: senderEmail },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text
        })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Brevo could not send the email');
    }

    return data;
};

const otpTemplates = {
    account_verification: {
        title: "Verify Your Account",
        heading: "Welcome to EventSystem!",
        message: "Thank you for creating an account. Please use the verification code below to verify your email address.",
        subject: "Verify Your EventSystem Account",
        color: "#4F46E5"
    },

    event_booking: {
        title: "Confirm Your Event Booking",
        heading: "Complete Your Booking!",
        message: "You are almost there! Enter the OTP below to confirm your event booking.",
        subject: "Your Event Booking OTP",
        color: "#059669"
    }
};

export const sendOtpMail = async (gmail, otp, type) => {
    try {
        const template = otpTemplates[type];

        if (!template) {
            throw new Error("Invalid OTP type");
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>

        <body style="
            margin: 0;
            padding: 0;
            background-color: #f4f4f7;
            font-family: Arial, Helvetica, sans-serif;
        ">

            <div style="
                max-width: 550px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #e5e7eb;
            ">

                <!-- Header -->
                <div style="
                    background-color: ${template.color};
                    padding: 30px 20px;
                    text-align: center;
                    color: #ffffff;
                ">
                    <h1 style="
                        margin: 0;
                        font-size: 26px;
                    ">
                        EventSystem
                    </h1>

                    <p style="
                        margin: 8px 0 0;
                        font-size: 14px;
                    ">
                        ${template.title}
                    </p>
                </div>

                <!-- Content -->
                <div style="padding: 35px 30px;">

                    <h2 style="
                        color: #111827;
                        font-size: 22px;
                        margin-top: 0;
                    ">
                        ${template.heading}
                    </h2>

                    <p style="
                        color: #4b5563;
                        font-size: 15px;
                        line-height: 1.7;
                    ">
                        ${template.message}
                    </p>

                    <!-- OTP Box -->
                    <div style="
                        background-color: #f9fafb;
                        border: 1px dashed ${template.color};
                        border-radius: 10px;
                        padding: 22px 10px;
                        text-align: center;
                        margin: 30px 0;
                    ">

                        <p style="
                            margin: 0 0 12px;
                            color: #6b7280;
                            font-size: 13px;
                        ">
                            YOUR VERIFICATION CODE
                        </p>

                        <h1 style="
                            margin: 0;
                            color: ${template.color};
                            font-size: 36px;
                            letter-spacing: 10px;
                        ">
                            ${otp}
                        </h1>
                    </div>

                    <p style="
                        color: #6b7280;
                        font-size: 14px;
                        line-height: 1.6;
                    ">
                        This OTP is valid for <strong>5 minutes</strong>.
                        Please do not share this code with anyone.
                    </p>

                    <p style="
                        color: #6b7280;
                        font-size: 14px;
                        line-height: 1.6;
                    ">
                        If you did not request this code, please ignore this email.
                    </p>

                </div>

                <!-- Footer -->
                <div style="
                    background-color: #f9fafb;
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                ">
                    <p style="
                        margin: 0;
                        color: #9ca3af;
                        font-size: 12px;
                    ">
                        © ${new Date().getFullYear()} EventSystem.
                        All rights reserved.
                    </p>
                </div>

            </div>

        </body>
        </html>
        `;

        const info = await sendEmail({
            to: gmail,
            subject: template.subject,
            html,
            text: `${template.heading}\n${template.message}\nYour OTP is: ${otp}\nValid for 5 minutes.`
        });

        return {
            success: true,
            message: "OTP email sent successfully",
            messageId: info.messageId
        };

    } catch (error) {
        console.error("OTP Email Error:", error.message);

        throw new Error("Failed to send OTP email");
    }
};

export const bookingMail = async (gmail, eventTitle, eventDate, eventLocation, amount = 0) => {
    try {
        const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount || '0.00';
        const info = await sendEmail({
            to: gmail,
            subject: "Event Booking Confirmation",
            html: `
                <p>Dear User,</p>
                <p>Your booking for the event "<strong>${eventTitle || 'Event'}</strong>" has been confirmed.</p>
                ${eventDate ? `<p><strong>Date:</strong> ${eventDate}</p>` : ''}
                ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ''}
                <p><strong>Amount:</strong> ₹${formattedAmount}</p>
                <p>Thank you for choosing EventSystem!</p>
            `,
            text: `Your booking for ${eventTitle || 'Event'} has been confirmed. Amount: ₹${formattedAmount}`
        });

        return {
            success: true,
            message: "Booking confirmation email sent successfully",
            messageId: info.messageId
        };

    } catch (error) {
        console.error("Booking Email Error:", error.message);

        throw new Error("Failed to send booking confirmation email");
    }
};

export const sendOTPEmail = sendOtpMail;
export const sendBookingEmail = async (gmail, userName, eventTitle, eventDate, eventLocation, amount) => {
    return bookingMail(gmail, eventTitle, eventDate, eventLocation, amount);
};
