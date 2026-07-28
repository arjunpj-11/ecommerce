const nodemailer = require("nodemailer");

// Async function to send OTP via email
async function sendOtpToEmail(otp, email) {
  try {
    // Validate OTP and Email
    if (!otp || !email) {
      throw new Error("OTP and email are required parameters.");
    }

    // Create a transporter object using your email provider's SMTP server
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Environment variable for sender email
        pass: process.env.EMAIL_PASS, // Environment variable for sender password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your ARNI verification code",
      text: `Your ARNI verification code is ${otp}. It is valid for 10 minutes. If you did not request this code, you can ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("❌ Error sending OTP:", error.message);
    return {
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    };
  }
}

module.exports = sendOtpToEmail;
