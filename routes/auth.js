var express = require("express");
var router = express.Router();

const signInRouter = require("./authentication/signin");
const signinOtpRouter = require("./authentication/signinotp");
const loginRouter = require("./authentication/login");
const forgetPasswordRouter = require("./authentication/forgetPassword");
const forgetPasswordOtpRouter = require("./authentication/forgetPasswordOtp");
const resetPasswordRouter = require("./authentication/resetPassword");

router.use("/signin", signInRouter);
router.use("/otp", signinOtpRouter);
router.use("/login", loginRouter);
router.use("/forgetPassword", forgetPasswordRouter);
router.use("/forgetPasswordOtp", forgetPasswordOtpRouter);
router.use("/resetPassword", resetPasswordRouter);

router.get("/terms", function (req, res, next) {
  res.render("../views/pages/authentication/terms", {
    siteName: "ARNI",
    currency: "INR",
    returnPeriod: "7",
    contactEmail: "info@arni.com",
    contactPhone: null,
    lastUpdated: "July 28, 2026",
  });
});

router.get("/privacy", function (req, res, next) {
  res.render("../views/pages/authentication/privacy", {
    siteName: "ARNI",
    minAge: "18",
    privacyEmail: "info@arni.com",
    companyAddress: "Kerala, India",
    lastUpdated: "July 28, 2026",
  });
});

router.get("/resetSuccess", function (req, res, next) {
  res.render("../views/pages/authentication/resetSuccess");
});

router.get("/already", function (req, res, next) {
  let value = req.session.value;
  res.render("../views/pages/authentication/already", { value });
});

router.get("/blocked", function (req, res, next) {
  res.render("../views/pages/authentication/blocked");
});

module.exports = router;
