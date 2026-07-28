// controllers/otpController.js
const generateRandomOTP = require("../../utilities/generateOtp");
const emailOtp = require("../../utilities/emailOtp");

// GET route to render the OTP page
exports.getOtpPage = (req, res, next) => {
  const value = req.session.value; // Retrieve the email or phone from session
  let error = req.session.error || null; // Retrieve error message from session, if any
  req.session.error = null; // Clear the error message from session
  res.render("../views/pages/authentication/forgetPasswordOtp", {
    value,
    error,
  }); // Render the OTP page
};

// POST route to verify the OTP
exports.verifyOtp = (req, res, next) => {
  try {
    if (
      !req.session.otp ||
      !req.session.otpExpiresAt ||
      Date.now() > req.session.otpExpiresAt
    ) {
      delete req.session.otp;
      delete req.session.otpExpiresAt;
      req.session.error = "Session expired. Please request a new OTP.";
      return res.redirect("/auth/forgetPasswordOtp");
    }

    const enteredOtp = Object.values(req.body).join("").trim();
    req.session.otpAttempts = (req.session.otpAttempts || 0) + 1;

    if (req.session.otpAttempts > 5) {
      delete req.session.otp;
      delete req.session.otpExpiresAt;
      req.session.error = "Too many attempts. Please request a new code.";
      return res.redirect("/auth/forgetPasswordOtp");
    }

    if (enteredOtp === req.session.otp) {
      req.session.passwordResetVerifiedAt = Date.now();
      delete req.session.otp;
      delete req.session.otpExpiresAt;
      delete req.session.otpAttempts;
      return res.redirect("/auth/resetPassword");
    } else {
      req.session.error = "That code is incorrect. Please try again.";
      return res.redirect("/auth/forgetPasswordOtp");
    }
  } catch (error) {
    console.error("Error in OTP verification:", error);
    req.session.error = "Something went wrong. Please try again.";
    return res.redirect("/auth/forgetPasswordOtp"); // Redirect back to OTP page on error
  }
};

// POST route to resend the OTP
exports.resendOtp = async (req, res) => {
  try {
    if (!req.session.value) {
      return res.status(400).json({
        message: "Your session expired. Start the password reset again.",
      });
    }

    req.session.otp = await generateRandomOTP();
    req.session.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    req.session.otpAttempts = 0;
    const delivery = await emailOtp(req.session.otp, req.session.value);
    if (!delivery.success) {
      throw new Error("OTP email delivery failed.");
    }

    return res.status(200).json({
      message: "A new verification code has been sent.",
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({
      message: "We could not resend the code. Please try again.",
    });
  }
};
