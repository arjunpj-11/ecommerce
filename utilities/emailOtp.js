const nodemailer = require('nodemailer');

// Async function to send OTP via email
async function sendOtpToEmail(otp, email) {
    try {
        // Validate OTP and Email
        if (!otp || !email) {
            throw new Error('OTP and email are required parameters.');
        }

        // Create a transporter object using your email provider's SMTP server
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,  // Environment variable for sender email
                pass: process.env.EMAIL_PASS, // Environment variable for sender password
            },
        });

        // Mail options
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender's email address
            to: email,                    // Recipient's email address
            subject: 'Your OTP Code',     // Email subject
            text: `Your One-Time Password (OTP) is: ${otp}. It is valid for 15 minutes.`, // OTP message
        };

        // Send OTP email
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ OTP sent successfully:', info.response);

        return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
        console.error('❌ Error sending OTP:', error.message);
        return { success: false, message: 'Failed to send OTP', error: error.message };
    }
}

module.exports = sendOtpToEmail;
