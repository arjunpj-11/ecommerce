const nodemailer = require("nodemailer");

// Async function to send OTP via email
async function sendEmail(status, email, orderId) {
  try {
    // Validate OTP and Email
    if (!status || !email || !orderId) {
      throw new Error("status,orderId and email are required parameters.");
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
      subject: "Your ARNI order status",
      text: `Your order ${orderId} has been ${status}.`,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Error sending mail:", error.message);
    return {
      success: false,
      message: "Failed to send email",
      error: error.message,
    };
  }
}

module.exports = sendEmail;
