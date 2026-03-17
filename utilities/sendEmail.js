const nodemailer = require('nodemailer');

// Async function to send OTP via email
async function sendEmail(status,email,orderId) {
    try {

        
        // Validate OTP and Email
        if (!status || !email|| !orderId) {
            throw new Error('status,orderId and email are required parameters.');
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
            subject: 'order status',     // Email subject
            text: `your order ${orderId} has been ${status}`, // OTP message
        };

        // Send OTP email
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ mail  sent successfully:', info.response);

        return { success: true, message: 'email sent successfully' };
    } catch (error) {
        console.error('❌ Error sending mail:', error.message);
        return { success: false, message: 'Failed to send Email', error: error.message };
    }
}

module.exports = sendEmail;
