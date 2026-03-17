// controllers/forgetPasswordController.js

const User = require('../../models/user');
const emailOtp = require('../../utilities/emailOtp');
const generateRandomOTP = require('../../utilities/generateOtp');

// GET forget password page
exports.getForgetPasswordPage = (req, res, next) => {
    let detail = {
        emailOrPhone: req.session.value,
    };
    let error = req.session.error || null; // Retrieve error message from session, if any
    req.session.error = null; // Clear the error message from session
    res.render('../views/pages/authentication/forgetPassword', { detail, error });
};

// POST send OTP
exports.sendOtp = async (req, res) => {
    try {
        req.session.value = req.body.emailOrPhone; // Store the email or phone in session
        let field = isNaN(req.session.value) ? 'email' : 'phone'; // Determine if the input is an email or phone
        let query = isNaN(req.session.value) ? { email: req.session.value } : { phone: req.session.value };

        const user = await User.findOne(query); // Find the user by email or phone
        if (!user) {
            req.session.error = "User  not found"; // Set error if user is not found
            return res.redirect('/auth/forgetPassword'); // Redirect back to the forget password page
        }

        req.session.otp = await generateRandomOTP(); // Generate a random OTP
        emailOtp(req.session.otp, req.session.value); // Send OTP to email or phone number

        // OTP expires in 10 minutes
        setTimeout(() => {
            delete req.session.otp; // Clear OTP from session after expiration
            delete req.session.enteredOtp; // Clear entered OTP from session
        }, 1000 * 60 * 10); // 10 minutes expiration

        res.redirect('/auth/forgetPasswordOtp'); // Redirect to OTP verification page
    } catch (error) {
        console.error("Error in sending OTP:", error);
        req.session.error = "Something went wrong. Please try again."; // Set error message
        res.redirect('/auth/forgetPassword'); // Redirect back to the forget password page
    }
};