const passport = require('passport');
const User = require('../../models/user');
const emailOtp = require('../../utilities/emailOtp');
const generateRandomOTP = require('../../utilities/generateOtp');
const cart = require('../../models/cart');

// 👉 **GET: Sign-in Page**
exports.getSignInPage = (req, res) => {
    let detail = {
        username: req.session.username,
        emailOrPhone: req.session.value,
    };
    res.render('../views/pages/authentication/signin', { detail }); // Render the sign-in page
};

// 👉 **POST: Handle Email-or-Phone Sign-in**
exports.handleSignInAuth = async (req, res) => {
    try {
        req.session.value = req.body.emailOrPhone; // Store email or phone in session
        req.session.username = req.body.name; // Store username in session
        req.session.password = req.body.password; // Store password in session

        // Determine if the input is an email or phone number
        if (isNaN(req.session.value)) {
            req.session.email = req.session.value; // Store email in session
            req.session.phone = null; // Clear phone
        } else {
            req.session.phone = req.session.value; // Store phone in session
            req.session.email = null; // Clear email
        }

        // Check if the user already exists
        const user = await User.findOne({ email: req.session.email });
        if (user) {
            return res.send("already"); // Indicate user already exists
        }

        // Generate and send OTP
        req.session.otp = await generateRandomOTP(); // Generate OTP
        emailOtp(req.session.otp, req.session.value); // Send OTP to email or phone number

        // Clear OTP after 10 hours
        setTimeout(() => {
            delete req.session.otp; // Clear OTP from session
            delete req.session.enteredOtp; // Clear entered OTP from session
        }, 1000 * 60 * 60 * 10); // 10 hours expiration

        res.send('done'); // Indicate successful OTP generation
    } catch (err) {
        console.error('Error during sign-in:', err.message);
        res.status(500).send('Internal server error. Please try again later.'); // Return error message
    }
};

// 👉 **Google Authentication**
exports.googleAuth = passport.authenticate('google', { scope: ['openid', 'profile', 'email'] });

// Handle Google authentication callback
exports.googleAuthCallback = async (req, res) => {
    try {
        req.session.username = req.user.displayName; // Store user's display name
        req.session.email = req.user.emails?.[0]?.value; // Store user's email

        // Check if the user already exists
        const user = await User.findOne({ email: req.session.email });
        if (user) {
            const isBlocked = await User.findOne({ email: req.session.email, status: 'Suspended' });
            if (isBlocked) {
                req.session.isAuthenticated = false; // Set authentication status to false
                return res.redirect('/auth/blocked'); // Redirect to blocked page
            }
            req.session.userId = user._id; // Store user ID in session
            req.session.isAuthenticated = true; // Set authentication status to true
            delete req.session.username; // Clear username from session
            delete req.session.phone; // Clear phone from session
            return res.redirect('/'); // Redirect to home page
        }

        // Create a new user
        let newUser  = await User.create({
            username: req.session.username,
            phone: req.session.phone,
            email: req.session.email
        });
        req.session.userId = newUser ._id; // Store new user ID in session

        // Create a cart for the new user
        await cart.create({ user: req.session.userId });

        delete req.session.username; // Clear username from session
        req.session.isAuthenticated = true; // Set authentication status to true
        return res.redirect('/'); // Redirect to home page
    } catch (err) {
        console.error('Error during Google authentication:', err.message);
        req.session.error = 'Error during authentication. Please try again.'; // Set error message
        return res.redirect('/auth/signin'); // Redirect to sign-in page
    }
};

// 👉 **Facebook Authentication**
exports.facebookAuth = passport.authenticate('facebook', { scope: ['email'] });

// Handle Facebook authentication callback
exports.facebookAuthCallback = async (req, res) => {
    try {
        req.session.username = req.user.displayName; // Store user's display name
        req.session.email = req.user.emails?.[0]?.value; // Store user's email

        // Check if the user already exists
        const user = await User.findOne({ email: req.session.email });
        if (user) {
            const isBlocked = await User.findOne({ email: req.session.email, status: 'Suspended' });
            if (isBlocked) {
                req.session.isAuthenticated = false; // Set authentication status to false
                return res.redirect('/blocked'); // Redirect to blocked page
            }
            req.session.userId = user._id; // Store user ID in session
            delete req.session.username; // Clear username from session
            delete req.session.phone; // Clear phone from session
            delete req.session.email; // Clear email from session
            req.session.isAuthenticated = true; // Set authentication status to true
            return res.redirect('/'); // Redirect to home page
        }

        // Create a new user
        const newUser  = await User.create({
            username: req.session.username,
            phone: req.session.phone,
            email: req.session.email
        });
        req.session.userId = newUser ._id; // Store new user ID in session

        delete req.session.username; // Clear username from session
        delete req.session.phone; // Clear phone from session
        delete req.session.email; // Clear email from session
        req.session.isAuthenticated = true; // Set authentication status to true

        return res.redirect('/'); // Redirect to home page
    } catch (err) {
        console.error('Error during Facebook authentication:', err.message);
        req.session.error = 'Error during authentication. Please try again.'; // Set error message
        return res.redirect('/auth/signin'); // Redirect to sign-in page
    }
};