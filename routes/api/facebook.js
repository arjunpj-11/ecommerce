const express = require("express");
const passport = require("passport");
const User = require("../../models/user");
const Cart = require("../../models/cart");
const generateUniqueUserId = require("../../utilities/generateUserId");

const router = express.Router();

// 👉 Facebook Authentication Route
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] }),
);

// 👉 Facebook Authentication Callback
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/signin" }),
  async (req, res) => {
    try {
      if (!req.user) {
        req.session.error = "Authentication failed. Please try again.";
        return res.redirect("/signin");
      }

      req.session.username = req.user.displayName;
      req.session.email = req.user.emails?.[0]?.value || ""; // Ensure email exists

      if (!req.session.email) {
        req.session.error = "No email found from Facebook authentication.";
        return res.redirect("/signin");
      }

      const user = await User.findOne({ email: req.session.email });

      if (user) {
        const isBlocked = await User.findOne({
          email: req.session.email,
          status: "Suspended",
        });

        if (isBlocked) {
          req.session.isAuthenticated = false;
          return res.redirect("/auth/blocked");
        }
        req.session.userId = user._id;

        req.session.isAuthenticated = true;
        delete req.session.username;
        delete req.session.phone;
        delete req.session.email;

        return res.redirect("/");
      }
      const userId = await generateUniqueUserId();
      // Register new user
      const newUser = await User.create({
        userId,
        username: req.session.username,
        phone: req.session.phone || "", // Avoid undefined values
        email: req.session.email,
      });
      req.session.userId = newUser._id;
      req.session.user = newUser._id;
      req.session.isAuthenticated = true;

      // Cleanup session & authenticate
      delete req.session.username;
      delete req.session.phone;
      delete req.session.email;
      req.session.isAuthenticated = true;

      return res.redirect("/");
    } catch (err) {
      console.error("Error in Facebook authentication:", err);
      req.session.error = "An unexpected error occurred. Please try again.";
      return res.redirect("/error"); // Redirect to an error page
    }
  },
);

module.exports = router;
