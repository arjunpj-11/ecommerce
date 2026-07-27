const express = require("express");
const router = express.Router();
const authController = require("../../controllers/authentication/signin");
const passport = require("passport");
const User = require("../../models/user");
const cart = require("../../models/cart");

// 👉 **GET: Sign-in Page**
router.get("/", authController.getSignInPage);

// 👉 **POST: Handle Email-or-Phone Sign-in**
router.post("/signinAuth", authController.handleSignInAuth);

module.exports = router;
