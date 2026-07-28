const passport = require("passport");
const User = require("../../models/user");
const emailOtp = require("../../utilities/emailOtp");
const generateRandomOTP = require("../../utilities/generateOtp");
const cart = require("../../models/cart");

// 👉 **GET: Sign-in Page**
exports.getSignInPage = (req, res) => {
  let detail = {
    username: req.session.username,
    emailOrPhone: req.session.value,
  };
  res.render("../views/pages/authentication/signin", { detail }); // Render the sign-in page
};

// 👉 **POST: Handle Email-or-Phone Sign-in**
exports.handleSignInAuth = async (req, res) => {
  try {
    const rawValue = String(req.body.emailOrPhone || "").trim();
    const username = String(req.body.name || "").trim();
    const password = String(req.body.password || "");
    const value = rawValue.toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!username || !emailPattern.test(value) || !strongPassword) {
      return res.status(400).send("invalid");
    }

    req.session.value = value;
    req.session.username = username;
    req.session.password = password;

    req.session.email = value;
    req.session.phone = null;

    const user = await User.findOne({ email: req.session.email });
    if (user) {
      return res.send("already");
    }

    req.session.otp = await generateRandomOTP();
    req.session.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    req.session.otpAttempts = 0;
    const delivery = await emailOtp(req.session.otp, req.session.value);
    if (!delivery.success) {
      throw new Error("OTP email delivery failed.");
    }

    res.send("done");
  } catch (err) {
    console.error("Error during sign-in:", err.message);
    res.status(500).send("error");
  }
};

// 👉 **Google Authentication**
exports.googleAuth = passport.authenticate("google", {
  scope: ["openid", "profile", "email"],
});

// Handle Google authentication callback
exports.googleAuthCallback = async (req, res) => {
  try {
    req.session.username = req.user.displayName; // Store user's display name
    req.session.email = req.user.emails?.[0]?.value; // Store user's email

    // Check if the user already exists
    const user = await User.findOne({ email: req.session.email });
    if (user) {
      const isBlocked = await User.findOne({
        email: req.session.email,
        status: "Suspended",
      });
      if (isBlocked) {
        req.session.isAuthenticated = false; // Set authentication status to false
        return res.redirect("/auth/blocked"); // Redirect to blocked page
      }
      req.session.userId = user._id; // Store user ID in session
      req.session.isAuthenticated = true; // Set authentication status to true
      delete req.session.username; // Clear username from session
      delete req.session.phone; // Clear phone from session
      return res.redirect("/"); // Redirect to home page
    }

    // Create a new user
    let newUser = await User.create({
      username: req.session.username,
      phone: req.session.phone,
      email: req.session.email,
    });
    req.session.userId = newUser._id; // Store new user ID in session

    // Create a cart for the new user
    await cart.create({ user: req.session.userId });

    delete req.session.username; // Clear username from session
    req.session.isAuthenticated = true; // Set authentication status to true
    return res.redirect("/"); // Redirect to home page
  } catch (err) {
    console.error("Error during Google authentication:", err.message);
    req.session.error = "Error during authentication. Please try again."; // Set error message
    return res.redirect("/auth/signin"); // Redirect to sign-in page
  }
};

// 👉 **Facebook Authentication**
exports.facebookAuth = passport.authenticate("facebook", { scope: ["email"] });

// Handle Facebook authentication callback
exports.facebookAuthCallback = async (req, res) => {
  try {
    req.session.username = req.user.displayName; // Store user's display name
    req.session.email = req.user.emails?.[0]?.value; // Store user's email

    // Check if the user already exists
    const user = await User.findOne({ email: req.session.email });
    if (user) {
      const isBlocked = await User.findOne({
        email: req.session.email,
        status: "Suspended",
      });
      if (isBlocked) {
        req.session.isAuthenticated = false; // Set authentication status to false
        return res.redirect("/blocked"); // Redirect to blocked page
      }
      req.session.userId = user._id; // Store user ID in session
      delete req.session.username; // Clear username from session
      delete req.session.phone; // Clear phone from session
      delete req.session.email; // Clear email from session
      req.session.isAuthenticated = true; // Set authentication status to true
      return res.redirect("/"); // Redirect to home page
    }

    // Create a new user
    const newUser = await User.create({
      username: req.session.username,
      phone: req.session.phone,
      email: req.session.email,
    });
    req.session.userId = newUser._id; // Store new user ID in session

    delete req.session.username; // Clear username from session
    delete req.session.phone; // Clear phone from session
    delete req.session.email; // Clear email from session
    req.session.isAuthenticated = true; // Set authentication status to true

    return res.redirect("/"); // Redirect to home page
  } catch (err) {
    console.error("Error during Facebook authentication:", err.message);
    req.session.error = "Error during authentication. Please try again."; // Set error message
    return res.redirect("/auth/signin"); // Redirect to sign-in page
  }
};
