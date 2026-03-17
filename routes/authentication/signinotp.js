var express = require('express');
var router = express.Router();
var otpController = require('../../controllers/authentication/signinotp'); // Import the OTP controller

/* GET users listing. */
router.get('/', otpController.getSigninOtp);

/* POST route for OTP verification */
router.post('/verify-otp', otpController.verifyOtp);

/* POST route for resending OTP */
router.post('/resendOtp', otpController.resendOtp);

module.exports = router;