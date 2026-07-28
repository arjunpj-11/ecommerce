// controllers/forgetPasswordController.js

const User = require("../../models/user");
const emailOtp = require("../../utilities/emailOtp");
const generateRandomOTP = require("../../utilities/generateOtp");

// GET forget password page
exports.getForgetPasswordPage = (req, res, next) => {
  let detail = {
    emailOrPhone: req.session.value,
  };
  let error = req.session.error || null; // Retrieve error message from session, if any
  req.session.error = null; // Clear the error message from session
  res.render("../views/pages/authentication/forgetPassword", { detail, error });
};

// POST send OTP
exports.sendOtp = async (req, res) => {
  try {
    const rawValue = String(req.body.emailOrPhone || "").trim();
    req.session.value = rawValue.toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(req.session.value)) {
      req.session.error = "Enter the email address registered to your account.";
      return res.redirect("/auth/forgetPassword");
    }

    const query = { email: req.session.value };

    const user = await User.findOne(query);
    if (!user) {
      req.session.error = "No account matches those details.";
      return res.redirect("/auth/forgetPassword");
    }

    req.session.otp = await generateRandomOTP();
    req.session.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    req.session.otpAttempts = 0;
    delete req.session.passwordResetVerifiedAt;
    const delivery = await emailOtp(req.session.otp, req.session.value);
    if (!delivery.success) {
      throw new Error("OTP email delivery failed.");
    }

    res.redirect("/auth/forgetPasswordOtp");
  } catch (error) {
    console.error("Error in sending OTP:", error);
    req.session.error = "We could not send the code. Please try again.";
    res.redirect("/auth/forgetPassword");
  }
};
