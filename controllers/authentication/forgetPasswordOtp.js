// controllers/otpController.js
const generateRandomOTP = require('../../utilities/generateOtp');
const emailOtp = require('../../utilities/emailOtp');

// GET route to render the OTP page
exports.getOtpPage = (req, res, next) => {
  const value = req.session.value; // Retrieve the email or phone from session
  let error = req.session.error || null; // Retrieve error message from session, if any
  req.session.error = null; // Clear the error message from session
  res.render('../views/pages/authentication/forgetPasswordOtp', { value, error }); // Render the OTP page
};

// POST route to verify the OTP
exports.verifyOtp = (req, res, next) => {
  try {
    // Ensure the OTP and session OTP exist
    if (!req.session.otp) {
      req.session.error = 'Session expired. Please request a new OTP.';
      return res.redirect('/auth/forgetPasswordOtp'); // Redirect if session OTP is missing
    }

    // Combine entered OTP from req.body
    req.session.enteredOtp = Object.values(req.body).join("").trim();
    console.log(req.session.enteredOtp);
    console.log(req.session.otp);

    // Compare entered OTP with session OTP
    if (req.session.enteredOtp === req.session.otp) {
      return res.redirect('/auth/resetPassword'); // Redirect to reset password page if OTP is valid
    } else {
      req.session.error = 'Invalid OTP. Please try again.';
      return res.redirect('/auth/forgetPasswordOtp'); // Redirect back to OTP page if OTP is invalid
    }

  } catch (error) {
    console.error('Error in OTP verification:', error);
    req.session.error = 'Something went wrong. Please try again.';
    return res.redirect('/auth/forgetPasswordOtp'); // Redirect back to OTP page on error
  }
};

// POST route to resend the OTP
exports.resendOtp = async (req, res) => {
  try {
    req.session.otp = await generateRandomOTP(); // Generate a new OTP
    await emailOtp(req.session.otp, req.session.value); // Send OTP to email or phone number
    console.log(req.session.otp);
    console.log(req.session.value);
    
    // Set a timeout to clear OTP after 10 hours
    setTimeout(() => {
      delete req.session.otp; // Clear OTP from session after expiration
      delete req.session.enteredOtp; // Clear entered OTP from session
    }, 1000 * 60 * 60 * 10); // 10 hours expiration
    
    return res.status(200).json({ message: 'OTP resent successfully.' }); // Return success message
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.status(500).json({ message: 'Failed to resend OTP.' }); // Return error message
  }
};