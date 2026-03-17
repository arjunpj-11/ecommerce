// routes/otpRoutes.js
var express = require('express');
var router = express.Router();
const otpController = require('../../controllers/authentication/forgetPasswordOtp');

// GET home page
router.get('/', otpController.getOtpPage);

// POST verify OTP
router.post('/verify-otp', otpController.verifyOtp);

// POST resend OTP
router.post('/resendOtp', otpController.resendOtp);

module.exports = router;