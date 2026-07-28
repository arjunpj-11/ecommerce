const User = require("../../models/user");
const bcrypt = require("bcryptjs");

// Render the reset password page
exports.getResetPasswordPage = (req, res, next) => {
  if (
    !req.session.passwordResetVerifiedAt ||
    Date.now() - req.session.passwordResetVerifiedAt > 10 * 60 * 1000
  ) {
    req.session.error = "Verify your account before choosing a new password.";
    return res.redirect("/auth/forgetPassword");
  }

  res.render("../views/pages/authentication/resetPassword");
};

// Handle password reset confirmation
exports.resetPasswordConfirm = async (req, res) => {
  try {
    if (
      !req.session.value ||
      !req.session.passwordResetVerifiedAt ||
      Date.now() - req.session.passwordResetVerifiedAt > 10 * 60 * 1000
    ) {
      return res.status(403).send("Password reset verification has expired.");
    }

    const newPassword = String(req.body.newPassword || req.body.password || "");
    const strongPassword =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword);

    if (!strongPassword) {
      return res
        .status(400)
        .send("Password does not meet the security requirements.");
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(newPassword, salt); // Hash the new password
    const query = req.session.value.includes("@")
      ? { email: req.session.value }
      : { phone: req.session.value };

    const result = await User.updateOne(query, {
      $set: { password: hashedPassword },
    });

    if (result.matchedCount !== 1) {
      return res.status(404).send("Account not found.");
    }

    delete req.session.value;
    delete req.session.passwordResetVerifiedAt;
    delete req.session.otp;
    delete req.session.otpExpiresAt;
    delete req.session.otpAttempts;

    res.send("done");
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("We could not reset your password. Please try again.");
  }
};
