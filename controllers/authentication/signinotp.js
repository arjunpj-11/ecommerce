const generateRandomOTP = require("../../utilities/generateOtp");
const emailOtp = require("../../utilities/emailOtp");
const User = require("../../models/user");
const generateUniqueUserId = require("../../utilities/generateUserId");

// GET users listing
exports.getSigninOtp = async (req, res) => {
  try {
    const value = req.session.value; // Get the email or phone from session
    let error = req.session.error || null; // Retrieve error message from session, if any
    req.session.error = null; // Clear error after use

    // Render the signinOtp page with value and error
    res.render("../views/pages/authentication/signinotp", { value, error });
  } catch (error) {
    console.error("Error rendering signinOtp page:", error);
    req.session.error = "Failed to load the OTP page. Please try again.";
    res.redirect("/auth/otp"); // Redirect to OTP page on error
  }
};

// POST route for OTP verification
exports.verifyOtp = async (req, res) => {
  try {
    if (
      !req.session.otp ||
      !req.session.otpExpiresAt ||
      Date.now() > req.session.otpExpiresAt
    ) {
      delete req.session.otp;
      delete req.session.otpExpiresAt;
      req.session.error = "Session expired. Please request a new OTP.";
      return res.redirect("/auth/otp");
    }

    const enteredOtp = Object.values(req.body).join("").trim();
    req.session.otpAttempts = (req.session.otpAttempts || 0) + 1;

    if (req.session.otpAttempts > 5) {
      delete req.session.otp;
      delete req.session.otpExpiresAt;
      req.session.error = "Too many attempts. Please request a new code.";
      return res.redirect("/auth/otp");
    }

    if (enteredOtp === req.session.otp) {
      delete req.session.otp;
      delete req.session.otpExpiresAt;
      delete req.session.otpAttempts;

      try {
        // Ensure all required registration data exists
        if (!req.session.username || !req.session.password) {
          throw new Error("Missing registration information");
        }

        const userId = await generateUniqueUserId(); // Generate a unique user ID
        const user = await User.create({
          userId,
          username: req.session.username,
          phone: req.session.phone,
          email: req.session.email || null, // Make email optional
          password: req.session.password,
        });

        req.session.userId = user._id; // Store user ID in session
        req.session.isAuthenticated = true; // Set authentication status

        // Clear registration data from session
        delete req.session.username;
        delete req.session.phone;
        delete req.session.email;
        delete req.session.password;
        delete req.session.value;

        return res.redirect("/"); // Redirect to home page
      } catch (err) {
        console.error("Error registering user:", err);
        req.session.error = "Error registering user. Please try again.";
        return res.redirect("/auth/register"); // Redirect to registration page on error
      }
    } else {
      req.session.error = "That code is incorrect. Please try again.";
      return res.redirect("/auth/otp");
    }
  } catch (error) {
    console.error("Error in OTP verification:", error);
    req.session.error =
      "Something went wrong during OTP verification. Please try again.";
    return res.redirect("/auth/otp"); // Redirect back to OTP page on error
  }
};

// POST route for resending OTP
exports.resendOtp = async (req, res) => {
  try {
    if (!req.session.value || !req.session.username || !req.session.password) {
      return res.status(400).json({
        message: "Your session expired. Please start registration again.",
      });
    }

    req.session.otp = await generateRandomOTP();
    req.session.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    req.session.otpAttempts = 0;
    const delivery = await emailOtp(req.session.otp, req.session.value);
    if (!delivery.success) {
      throw new Error("OTP email delivery failed.");
    }

    res.status(200).json({ message: "A new verification code has been sent." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    req.session.error = "Failed to resend OTP. Please try again later.";
    return res.status(500).json({ message: "Failed to resend OTP." }); // Return error message
  }
};
