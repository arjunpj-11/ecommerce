// routes/forgetPassword.js

var express = require('express');
var router = express.Router();
const forgetPasswordController = require('../../controllers/authentication/forgetPassword');

// GET forget password page
router.get('/', forgetPasswordController.getForgetPasswordPage);

// POST send OTP
router.post('/sendOtp', forgetPasswordController.sendOtp);

module.exports = router;